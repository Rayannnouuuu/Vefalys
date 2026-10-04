import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { APPOINTMENT_TYPES } from '../lib/enums'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string>
    const where: any = {}
    if (from || to) {
      where.startAt = {}
      if (from) where.startAt.gte = new Date(from)
      if (to) where.startAt.lte = new Date(to)
    }
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarColor: true } },
      },
      orderBy: { startAt: 'asc' },
    })
    res.json(appointments)
  }),
)

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(APPOINTMENT_TYPES).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  location: z.string().optional(),
  description: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  reminderMinutesBefore: z.number().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = schema.parse(req.body)
    const appointment = await prisma.appointment.create({ data: { ...data, createdById: req.user!.id } })
    res.status(201).json(appointment)
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = schema.partial().parse(req.body)
    const appointment = await prisma.appointment.update({ where: { id: req.params.id }, data })
    res.json(appointment)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.appointment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export default router
