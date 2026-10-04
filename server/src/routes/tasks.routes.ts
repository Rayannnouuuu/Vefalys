import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { TASK_PRIORITIES, TASK_STATUSES, TASK_RECURRENCES } from '../lib/enums'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, assignedToId, contactId } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId
    if (contactId) where.contactId = contactId
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, title: true } },
      },
      orderBy: [{ dueDate: 'asc' }],
    })
    res.json(tasks)
  }),
)

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignedToId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  recurrence: z.enum(TASK_RECURRENCES).optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = schema.parse(req.body)
    const task = await prisma.task.create({ data: { ...data, createdById: req.user!.id, assignedToId: data.assignedToId || req.user!.id } })
    res.status(201).json(task)
  }),
)

const updateSchema = schema.partial().extend({ status: z.enum(TASK_STATUSES).optional() })

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const task = await prisma.task.update({ where: { id: req.params.id }, data })

    // Tache recurrente terminee -> on cree automatiquement la prochaine occurrence
    if (data.status === 'TERMINEE' && task.recurrence !== 'NONE' && task.dueDate) {
      const next = new Date(task.dueDate)
      if (task.recurrence === 'WEEKLY') next.setDate(next.getDate() + 7)
      if (task.recurrence === 'MONTHLY') next.setMonth(next.getMonth() + 1)
      await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          dueDate: next,
          priority: task.priority,
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          contactId: task.contactId,
          opportunityId: task.opportunityId,
          recurrence: task.recurrence,
        },
      })
    }
    res.json(task)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.task.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export default router
