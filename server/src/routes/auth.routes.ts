import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'
import { sendVerificationEmail, sendAccountPendingAdminEmail } from '../lib/mailer'
import { createNotification } from '../lib/notifications'

const router = Router()

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const clientUrl = () => process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173'

function newVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function notifyAdminsOfPendingAccount(user: { firstName: string; lastName: string; email: string }) {
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true } })
  const name = `${user.firstName} ${user.lastName}`
  for (const admin of admins) {
    await createNotification(admin.id, 'SYSTEME', 'Nouveau compte en attente', `${name} (${user.email}) attend votre validation.`, '/parametres/equipe')
    await sendAccountPendingAdminEmail(admin.email, name, user.email).catch((e) => console.error('sendAccountPendingAdminEmail failed', e))
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { password, ...profile } = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: profile.email } })
    if (existing) throw new HttpError(409, 'Un compte existe deja avec cet email')

    const userCount = await prisma.user.count()
    const passwordHash = await bcrypt.hash(password, 10)

    // Le tout premier compte de l'instance devient ADMIN et est immediatement actif : il n'y a
    // sinon personne pour valider son propre compte. Tout inscription suivante passe par le
    // circuit complet (email a confirmer, puis validation par un administrateur).
    if (userCount === 0) {
      const user = await prisma.user.create({
        data: { ...profile, passwordHash, role: 'ADMIN', emailVerified: true, approvalStatus: 'APPROVED' },
      })
      await logAudit(user.id, 'CREATE', 'User', user.id, { email: user.email, bootstrap: true })
      const token = signToken({ userId: user.id, role: user.role })
      return res.status(201).json({
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarColor: user.avatarColor },
      })
    }

    const emailVerificationToken = newVerificationToken()
    const user = await prisma.user.create({
      data: {
        ...profile,
        passwordHash,
        role: 'COLLABORATEUR',
        isActive: false,
        emailVerified: false,
        approvalStatus: 'PENDING',
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
      },
    })
    await logAudit(user.id, 'CREATE', 'User', user.id, { email: user.email })
    await sendVerificationEmail(user.email, user.firstName, `${clientUrl()}/verifier-email?token=${emailVerificationToken}`).catch((e) =>
      console.error('sendVerificationEmail failed', e),
    )

    res.status(201).json({ pendingVerification: true, email: user.email })
  }),
)

const verifyEmailSchema = z.object({ token: z.string().min(10) })

router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = verifyEmailSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } })
    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new HttpError(400, 'Lien de confirmation invalide ou expire')
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
    })
    await logAudit(user.id, 'VERIFY_EMAIL', 'User', user.id)
    await notifyAdminsOfPendingAccount(user)
    res.json({ verified: true, pendingApproval: user.approvalStatus === 'PENDING' })
  }),
)

const resendSchema = z.object({ email: z.string().email() })

router.post(
  '/resend-verification',
  asyncHandler(async (req, res) => {
    const { email } = resendSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    // Reponse identique que le compte existe ou non, pour ne pas reveler les emails inscrits.
    if (user && !user.emailVerified) {
      const emailVerificationToken = newVerificationToken()
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken, emailVerificationExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
      })
      await sendVerificationEmail(user.email, user.firstName, `${clientUrl()}/verifier-email?token=${emailVerificationToken}`).catch((e) =>
        console.error('sendVerificationEmail failed', e),
      )
    }
    res.json({ sent: true })
  }),
)

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) throw new HttpError(401, 'Email ou mot de passe incorrect', 'INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw new HttpError(401, 'Email ou mot de passe incorrect', 'INVALID_CREDENTIALS')

    // Au-dela de ce point le mot de passe est prouve correct : on peut donner un message
    // precis sans risque d'enumeration de comptes.
    if (!user.emailVerified) {
      throw new HttpError(403, 'Confirmez votre adresse email avant de vous connecter (verifiez votre boite de reception).', 'EMAIL_NOT_VERIFIED')
    }
    if (user.approvalStatus === 'PENDING') {
      throw new HttpError(403, 'Votre compte est en attente de validation par un administrateur.', 'PENDING_APPROVAL')
    }
    if (user.approvalStatus === 'REJECTED') {
      throw new HttpError(403, 'Votre demande de compte n\'a pas ete validee. Contactez un administrateur.', 'REJECTED')
    }
    if (!user.isActive) {
      throw new HttpError(403, 'Ce compte a ete desactive. Contactez un administrateur.', 'DISABLED')
    }

    await logAudit(user.id, 'LOGIN', 'User', user.id)
    const token = signToken({ userId: user.id, role: user.role })
    res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarColor: user.avatarColor },
    })
  }),
)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw new HttpError(404, 'Utilisateur introuvable')
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarColor: user.avatarColor })
  }),
)

export default router
