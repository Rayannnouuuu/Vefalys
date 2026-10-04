import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { INTERACTION_TYPES } from '../lib/enums'

const router = Router()
router.use(authenticate)

const schema = z.object({
  contactId: z.string(),
  type: z.enum(INTERACTION_TYPES),
  subject: z.string().optional(),
  content: z.string().optional(),
  occurredAt: z.coerce.date().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = schema.parse(req.body)
    const interaction = await prisma.interaction.create({
      data: { ...data, userId: req.user!.id },
    })
    await prisma.contact.update({ where: { id: data.contactId }, data: { updatedAt: new Date() } })
    res.status(201).json(interaction)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.interaction.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export default router
