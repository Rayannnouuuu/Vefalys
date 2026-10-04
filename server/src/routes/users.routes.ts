import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, avatarColor: true, createdAt: true },
      orderBy: { firstName: 'asc' },
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
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'User', user.id, data)
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, isActive: user.isActive })
  }),
)

export default router
