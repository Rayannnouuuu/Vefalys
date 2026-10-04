import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { OPPORTUNITY_STAGES } from '../lib/enums'
import { logAudit } from '../lib/audit'
import { requirePermission } from '../lib/permissions'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { stage, ownerId, contactId } = req.query as Record<string, string>
    const where: any = {}
    if (stage) where.stage = stage
    if (ownerId) where.ownerId = ownerId
    if (contactId) where.contactId = contactId
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(opportunities)
  }),
)

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.opportunity.groupBy({
      by: ['stage'],
      _sum: { amount: true },
      _count: { _all: true },
    })
    const wonLost = await prisma.opportunity.findMany({ where: { stage: { in: ['FERME_GAGNE', 'FERME_PERDU'] } } })
    const won = wonLost.filter((o) => o.stage === 'FERME_GAGNE').length
    const conversionRate = wonLost.length ? Math.round((won / wonLost.length) * 100) : 0
    res.json({ byStage: grouped, conversionRate, totalWon: won, totalLost: wonLost.length - won })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const opp = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
        history: { orderBy: { changedAt: 'desc' } },
        relances: { orderBy: { dueDate: 'asc' } },
        tasks: true,
        devis: true,
        factures: true,
        attachments: true,
      },
    })
    if (!opp) throw new HttpError(404, 'Opportunite introuvable')
    res.json(opp)
  }),
)

const createSchema = z.object({
  title: z.string().min(1),
  contactId: z.string(),
  amount: z.number().nonnegative().default(0),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.coerce.date().optional(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const opp = await prisma.opportunity.create({
      data: { ...data, ownerId: data.ownerId || req.user!.id },
    })
    await prisma.opportunityHistory.create({ data: { opportunityId: opp.id, toStage: opp.stage } })
    await logAudit(req.user!.id, 'CREATE', 'Opportunity', opp.id, { title: opp.title })
    res.status(201).json(opp)
  }),
)

const updateSchema = z.object({
  title: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  lostReason: z.string().optional(),
})

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const opp = await prisma.opportunity.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'Opportunity', opp.id, data)
    res.json(opp)
  }),
)

const stageSchema = z.object({ stage: z.enum(OPPORTUNITY_STAGES), lostReason: z.string().optional() })

router.patch(
  '/:id/stage',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { stage, lostReason } = stageSchema.parse(req.body)
    const current = await prisma.opportunity.findUnique({ where: { id: req.params.id } })
    if (!current) throw new HttpError(404, 'Opportunite introuvable')

    const isClosing = stage === 'FERME_GAGNE' || stage === 'FERME_PERDU'
    const opp = await prisma.opportunity.update({
      where: { id: req.params.id },
      data: {
        stage,
        lostReason: stage === 'FERME_PERDU' ? lostReason : undefined,
        closedAt: isClosing ? new Date() : null,
      },
    })
    await prisma.opportunityHistory.create({
      data: { opportunityId: opp.id, fromStage: current.stage, toStage: stage, changedById: req.user!.id },
    })
    await logAudit(req.user!.id, 'STAGE_CHANGE', 'Opportunity', opp.id, { from: current.stage, to: stage })
    res.json(opp)
  }),
)

router.delete(
  '/:id',
  requirePermission('COLLAB_DELETE_OPPORTUNITIES'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.opportunity.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Opportunity', req.params.id)
    res.status(204).end()
  }),
)

export default router
