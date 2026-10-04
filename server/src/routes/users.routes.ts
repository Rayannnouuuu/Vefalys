import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '../lib/mailer'
import { createNotification } from '../lib/notifications'

const router = Router()
router.use(authenticate)

const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  avatarColor: true,
  createdAt: true,
  emailVerified: true,
  approvalStatus: true,
  approvedAt: true,
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: userListSelect, orderBy: { firstName: 'asc' } })
    res.json(users)
  }),
)

router.get(
  '/pending',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      select: userListSelect,
      orderBy: { createdAt: 'asc' },
    })
    res.json(users)
  }),
)

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATEUR']),
  password: z.string().min(8),
})

router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = inviteSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new HttpError(409, 'Un compte existe deja avec cet email')
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({ data: { ...data, passwordHash } })
    await logAudit(req.user!.id, 'CREATE', 'User', user.id, { email: user.email })
    res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role })
  }),
)

// --- Mot de passe (en premier, pour ne pas matcher sur /:id) ---
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

router.post(
  '/me/change-password',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw new HttpError(404, 'Utilisateur introuvable')
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!valid) throw new HttpError(401, 'Mot de passe actuel incorrect')
    const passwordHash = await bcrypt.hash(data.newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    await logAudit(user.id, 'CHANGE_PASSWORD', 'User', user.id)
    res.status(204).end()
  }),
)

const resetPasswordSchema = z.object({ newPassword: z.string().min(8) })

router.post(
  '/:id/reset-password',
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { newPassword } = resetPasswordSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(newPassword, 10)
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } })
    await logAudit(req.user!.id, 'RESET_PASSWORD', 'User', user.id)
    res.status(204).end()
  }),
)

router.post(
  '/:id/approve',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const candidate = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!candidate) throw new HttpError(404, 'Utilisateur introuvable')
    if (candidate.approvalStatus !== 'PENDING') throw new HttpError(409, "Ce compte n'est plus en attente")
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'APPROVED', isActive: true, approvedById: req.user!.id, approvedAt: new Date(), rejectedReason: null },
    })
    await logAudit(req.user!.id, 'APPROVE', 'User', user.id, { email: user.email })
    await createNotification(user.id, 'SYSTEME', 'Compte valide', 'Votre compte a ete valide, vous pouvez vous connecter.', '/connexion')
    await sendAccountApprovedEmail(user.email, user.firstName, `${process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173'}/connexion`).catch(
      (e) => console.error('sendAccountApprovedEmail failed', e),
    )
    res.json({ id: user.id, approvalStatus: user.approvalStatus, isActive: user.isActive })
  }),
)

const rejectSchema = z.object({ reason: z.string().optional() })

router.post(
  '/:id/reject',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { reason } = rejectSchema.parse(req.body)
    const candidate = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!candidate) throw new HttpError(404, 'Utilisateur introuvable')
    if (candidate.approvalStatus !== 'PENDING') throw new HttpError(409, "Ce compte n'est plus en attente")
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'REJECTED', isActive: false, approvedById: req.user!.id, approvedAt: new Date(), rejectedReason: reason || null },
    })
    await logAudit(req.user!.id, 'REJECT', 'User', user.id, { email: user.email, reason })
    await sendAccountRejectedEmail(user.email, user.firstName, reason).catch((e) => console.error('sendAccountRejectedEmail failed', e))
    res.json({ id: user.id, approvalStatus: user.approvalStatus })
  }),
)

// Protege contre la perte totale d'acces admin : refuse de retirer le dernier admin actif
// (suppression, desactivation ou changement de role).
async function assertNotLastActiveAdmin(userId: string, reason: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.role !== 'ADMIN' || !target.isActive) return
  const otherActiveAdmins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: userId } } })
  if (otherActiveAdmins === 0) {
    throw new HttpError(409, `Impossible de ${reason} : c'est le dernier compte administrateur actif.`)
  }
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATEUR']).optional(),
  isActive: z.boolean().optional(),
})

router.patch(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing && existing.id !== req.params.id) throw new HttpError(409, 'Un compte existe deja avec cet email')
    }
    if ((data.role && data.role !== 'ADMIN') || data.isActive === false) {
      await assertNotLastActiveAdmin(req.params.id, data.isActive === false ? 'desactiver ce compte' : 'retirer le role administrateur')
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'User', user.id, data)
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, isActive: user.isActive })
  }),
)

router.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.params.id === req.user!.id) {
      throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte.')
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) throw new HttpError(404, 'Utilisateur introuvable')
    await assertNotLastActiveAdmin(req.params.id, 'supprimer ce compte')

    await prisma.user.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'User', req.params.id, { email: target.email })
    res.status(204).end()
  }),
)

export default router
