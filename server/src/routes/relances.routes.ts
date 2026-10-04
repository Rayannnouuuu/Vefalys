import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { RELANCE_TYPES, RELANCE_STATUSES } from '../lib/enums'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { from, to, status, assignedToId } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId
    if (from || to) {
      where.dueDate = {}
      if (from) where.dueDate.gte = new Date(from)
      if (to) where.dueDate.lte = new Date(to)
    }
    const relances = await prisma.relance.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        opportunity: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        template: true,
      },
      orderBy: { dueDate: 'asc' },
    })
    res.json(relances)
  }),
)

const schema = z.object({
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  type: z.enum(RELANCE_TYPES),
  dueDate: z.coerce.date(),
  note: z.string().optional(),
  assignedToId: z.string().optional(),
  templateId: z.string().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = schema.parse(req.body)
    const relance = await prisma.relance.create({ data: { ...data, assignedToId: data.assignedToId || req.user!.id } })
    res.status(201).json(relance)
  }),
)

const updateSchema = z.object({
  dueDate: z.coerce.date().optional(),
  status: z.enum(RELANCE_STATUSES).optional(),
  note: z.string().optional(),
  assignedToId: z.string().optional(),
})

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const relance = await prisma.relance.update({
      where: { id: req.params.id },
      data: { ...data, completedAt: data.status === 'FAITE' ? new Date() : undefined },
    })
    res.json(relance)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.relance.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

// Modeles de relance (emails/SMS)
router.get(
  '/templates/all',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.relanceTemplate.findMany({ orderBy: { name: 'asc' } }))
  }),
)

const templateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['EMAIL', 'SMS']),
  subject: z.string().optional(),
  body: z.string().min(1),
})

router.post(
  '/templates',
  asyncHandler(async (req, res) => {
    const data = templateSchema.parse(req.body)
    res.status(201).json(await prisma.relanceTemplate.create({ data }))
  }),
)

export default router
