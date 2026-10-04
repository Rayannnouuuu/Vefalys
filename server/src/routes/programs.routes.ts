import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { PROGRAM_STATUSES, UNIT_TYPOLOGIES, UNIT_STATUSES, PROGRAM_DOCUMENT_TYPES } from '../lib/enums'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string>
    const where: any = status ? { status } : {}
    const programs = await prisma.program.findMany({
      where,
      include: { units: true, prospectPrograms: { select: { id: true, stage: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const withStats = programs.map((p) => {
      const unitsByTypology: Record<string, { total: number; disponible: number }> = {}
      for (const u of p.units) {
        unitsByTypology[u.typology] ??= { total: 0, disponible: 0 }
        unitsByTypology[u.typology].total++
        if (u.status === 'DISPONIBLE') unitsByTypology[u.typology].disponible++
      }
      return {
        ...p,
        unitsByTypology,
        totalUnits: p.units.length,
        totalProspects: p.prospectPrograms.length,
        signedCount: p.prospectPrograms.filter((pp) => pp.stage === 'ACTE_SIGNE').length,
      }
    })
    res.json(withStats)
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        units: { orderBy: [{ typology: 'asc' }, { reference: 'asc' }] },
        documents: true,
        prospectPrograms: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            unit: true,
            dossierPieces: true,
            commissions: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    })
    if (!program) throw new HttpError(404, 'Programme introuvable')
    res.json(program)
  }),
)

const programSchema = z.object({
  name: z.string().min(1),
  promoterName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  status: z.enum(PROGRAM_STATUSES).optional(),
  description: z.string().optional(),
  pricePerM2Avg: z.number().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = programSchema.parse(req.body)
    const program = await prisma.program.create({ data })
    await logAudit(req.user!.id, 'CREATE', 'Program', program.id, { name: program.name })
    res.status(201).json(program)
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = programSchema.partial().parse(req.body)
    const program = await prisma.program.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'Program', program.id, data)
    res.json(program)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.program.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Program', req.params.id)
    res.status(204).end()
  }),
)

// --- Unites ---
const unitSchema = z.object({
  reference: z.string().min(1),
  typology: z.enum(UNIT_TYPOLOGIES),
  floor: z.number().optional(),
  surface: z.number().optional(),
  price: z.number().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
})

router.post(
  '/:id/units',
  asyncHandler(async (req, res) => {
    const data = unitSchema.parse(req.body)
    const unit = await prisma.programUnit.create({ data: { ...data, programId: req.params.id } })
    res.status(201).json(unit)
  }),
)

router.patch(
  '/units/:unitId',
  asyncHandler(async (req, res) => {
    const data = unitSchema.partial().parse(req.body)
    const unit = await prisma.programUnit.update({ where: { id: req.params.unitId }, data })
    res.json(unit)
  }),
)

router.delete(
  '/units/:unitId',
  asyncHandler(async (req, res) => {
    await prisma.programUnit.delete({ where: { id: req.params.unitId } })
    res.status(204).end()
  }),
)

// --- Documents du programme (plans, DPE, permis...) ---
const docSchema = z.object({ name: z.string().min(1), type: z.enum(PROGRAM_DOCUMENT_TYPES), path: z.string().min(1) })

router.post(
  '/:id/documents',
  asyncHandler(async (req, res) => {
    const data = docSchema.parse(req.body)
    const doc = await prisma.programDocument.create({ data: { ...data, programId: req.params.id } })
    res.status(201).json(doc)
  }),
)

router.delete(
  '/documents/:docId',
  asyncHandler(async (req, res) => {
    await prisma.programDocument.delete({ where: { id: req.params.docId } })
    res.status(204).end()
  }),
)

export default router
