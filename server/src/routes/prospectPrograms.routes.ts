import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { PROSPECT_PROGRAM_STAGES, DOSSIER_PIECE_TYPES, DOSSIER_PIECE_STATUSES, GENERATED_DOCUMENT_TYPES } from '../lib/enums'
import { createDossierPiecesChecklist, handleStageTransition } from '../services/prospectProgram.service'
import { generateMandatVente, generateOffreAchat, generateCompromisVente } from '../services/documentTemplates'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { stage, programId, contactId, stale } = req.query as Record<string, string>
    const where: any = {}
    if (stage) where.stage = stage
    if (programId) where.programId = programId
    if (contactId) where.contactId = contactId
    if (stale === 'true') {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - 21)
      where.updatedAt = { lt: threshold }
      where.stage = { notIn: ['ACTE_SIGNE', 'PERDU'] }
    }
    const dossiers = await prisma.prospectProgram.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        program: { select: { id: true, name: true, city: true } },
        unit: true,
        dossierPieces: true,
        commissions: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(dossiers)
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const dossier = await prisma.prospectProgram.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        program: true,
        unit: true,
        dossierPieces: true,
        commissions: { include: { facture: true } },
        generatedDocuments: { orderBy: { generatedAt: 'desc' } },
        stageHistory: { orderBy: { changedAt: 'desc' } },
        attachments: true,
        factures: true,
      },
    })
    if (!dossier) throw new HttpError(404, 'Dossier introuvable')
    res.json(dossier)
  }),
)

const createSchema = z.object({
  contactId: z.string(),
  programId: z.string(),
  unitId: z.string().optional(),
  interestedTypology: z.string().optional(),
  offerPrice: z.number().optional(),
  financingCondition: z.string().optional(),
  notes: z.string().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const dossier = await prisma.prospectProgram.create({ data })
    await createDossierPiecesChecklist(dossier.id)
    await handleStageTransition(dossier.id, null, 'PROSPECTION')
    await logAudit(req.user!.id, 'CREATE', 'ProspectProgram', dossier.id)
    res.status(201).json(dossier)
  }),
)

const updateSchema = z.object({
  unitId: z.string().optional(),
  interestedTypology: z.string().optional(),
  offerPrice: z.number().optional(),
  financingCondition: z.string().optional(),
  notes: z.string().optional(),
})

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const dossier = await prisma.prospectProgram.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'ProspectProgram', dossier.id, data)
    res.json(dossier)
  }),
)

const stageSchema = z.object({ stage: z.enum(PROSPECT_PROGRAM_STAGES) })

router.patch(
  '/:id/stage',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { stage } = stageSchema.parse(req.body)
    const current = await prisma.prospectProgram.findUnique({ where: { id: req.params.id } })
    if (!current) throw new HttpError(404, 'Dossier introuvable')
    const dossier = await prisma.prospectProgram.update({ where: { id: req.params.id }, data: { stage } })
    await handleStageTransition(dossier.id, current.stage, stage, req.user!.id)
    await logAudit(req.user!.id, 'STAGE_CHANGE', 'ProspectProgram', dossier.id, { from: current.stage, to: stage })
    res.json(dossier)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.prospectProgram.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'ProspectProgram', req.params.id)
    res.status(204).end()
  }),
)

// --- Pieces du dossier ---
const pieceUpdateSchema = z.object({ status: z.enum(DOSSIER_PIECE_STATUSES), note: z.string().optional() })

router.patch(
  '/pieces/:pieceId',
  asyncHandler(async (req, res) => {
    const data = pieceUpdateSchema.parse(req.body)
    const piece = await prisma.dossierPiece.update({
      where: { id: req.params.pieceId },
      data: { ...data, receivedAt: data.status !== 'MANQUANT' ? new Date() : null },
    })
    res.json(piece)
  }),
)

const addPieceSchema = z.object({ type: z.enum(DOSSIER_PIECE_TYPES) })
router.post(
  '/:id/pieces',
  asyncHandler(async (req, res) => {
    const { type } = addPieceSchema.parse(req.body)
    const piece = await prisma.dossierPiece.create({ data: { prospectProgramId: req.params.id, type } })
    res.status(201).json(piece)
  }),
)

// --- Generation de documents ---
const generateSchema = z.object({ type: z.enum(GENERATED_DOCUMENT_TYPES) })

router.post(
  '/:id/documents/generate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { type } = generateSchema.parse(req.body)
    const pp = await prisma.prospectProgram.findUnique({
      where: { id: req.params.id },
      include: { contact: true, program: true, unit: true },
    })
    if (!pp) throw new HttpError(404, 'Dossier introuvable')

    let content: string
    switch (type) {
      case 'MANDAT_VENTE':
        content = generateMandatVente(pp)
        break
      case 'OFFRE_ACHAT':
        content = generateOffreAchat(pp)
        break
      case 'COMPROMIS_VENTE':
        content = generateCompromisVente(pp)
        break
      default:
        throw new HttpError(400, 'Type de document non pris en charge pour la generation directe')
    }

    const doc = await prisma.generatedDocument.create({
      data: { prospectProgramId: pp.id, type, content, generatedById: req.user!.id },
    })
    await logAudit(req.user!.id, 'GENERATE_DOCUMENT', 'ProspectProgram', pp.id, { type })
    res.status(201).json(doc)
  }),
)

export default router
