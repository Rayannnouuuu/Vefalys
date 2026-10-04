import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  // Le premier utilisateur cree sur l'instance devient ADMIN automatiquement (voir handler).
  role: z.enum(['ADMIN', 'MANAGER', 'COLLABORATEUR']).optional(),
})

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new HttpError(409, 'Un compte existe deja avec cet email')

    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : data.role || 'COLLABORATEUR'
    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
      },
    })

    await logAudit(user.id, 'CREATE', 'User', user.id, { email: user.email })
    const token = signToken({ userId: user.id, role: user.role })
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatarColor: user.avatarColor },
    })
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
    if (!user || !user.isActive) throw new HttpError(401, 'Email ou mot de passe incorrect')

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw new HttpError(401, 'Email ou mot de passe incorrect')

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
