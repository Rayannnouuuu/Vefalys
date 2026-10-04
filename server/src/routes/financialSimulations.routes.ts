import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'
import { SIMULATION_OBJECTIFS, SIMULATION_TYPES_BIEN, SIMULATION_ZONES } from '../lib/enums'
import { computeSimulation, type SimulationInput } from '../lib/financialSimulation'

const router = Router()
router.use(authenticate)

const inputSchema = z.object({
  contactId: z.string().optional().nullable(),
  label: z.string().optional(),
  objectif: z.enum(SIMULATION_OBJECTIFS).default('PRINCIPALE'),
  typeBien: z.enum(SIMULATION_TYPES_BIEN).default('APPARTEMENT_NEUF'),
  primoAccedant: z.boolean().default(true),
  revenusMensuels: z.number().min(0),
  chargesMensuelles: z.number().min(0).default(0),
  apport: z.number().min(0).default(0),
  dureeAnnees: z.number().int().min(1).max(30).default(20),
  tauxPersonnalise: z.number().min(0).max(15).optional().nullable(),
  personnesFoyer: z.number().int().min(1).max(8).default(1),
  zone: z.enum(SIMULATION_ZONES).default('A'),
  revenuFiscalReference: z.number().min(0).optional().nullable(),
  prixBienVise: z.number().min(0).optional().nullable(),
})

// Calcule sans enregistrer - utilise par l'assistant pas-a-pas pour la previsualisation live.
router.post(
  '/compute',
  asyncHandler(async (req, res) => {
    const data = inputSchema.parse(req.body)
    const result = computeSimulation(data as SimulationInput)
    res.json(result)
  }),
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { contactId } = req.query as Record<string, string>
    const simulations = await prisma.financialSimulation.findMany({
      where: contactId ? { contactId } : undefined,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(simulations)
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const simulation = await prisma.financialSimulation.findUnique({
      where: { id: req.params.id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!simulation) throw new HttpError(404, 'Simulation introuvable')
    res.json(simulation)
  }),
)

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = inputSchema.parse(req.body)
    const result = computeSimulation(data as SimulationInput)
    const simulation = await prisma.financialSimulation.create({
      data: {
        contactId: data.contactId || null,
        label: data.label || null,
        objectif: data.objectif,
        typeBien: data.typeBien,
        primoAccedant: data.primoAccedant,
        revenusMensuels: data.revenusMensuels,
        chargesMensuelles: data.chargesMensuelles,
        apport: data.apport,
        dureeAnnees: data.dureeAnnees,
        tauxPersonnalise: data.tauxPersonnalise ?? null,
        personnesFoyer: data.personnesFoyer,
        zone: data.zone,
        revenuFiscalReference: data.revenuFiscalReference ?? null,
        prixBienVise: data.prixBienVise ?? null,
        tauxApplique: result.tauxApplique,
        mensualiteMax: result.mensualiteMax,
        capaciteEmprunt: result.capaciteEmprunt,
        fraisNotaire: result.fraisNotaire,
        coutInterets: result.coutInterets,
        tauxEndettement: result.tauxEndettement,
        budgetFinancable: result.budgetFinancable,
        ptzEligible: result.ptzEligible,
        ptzMontant: result.ptzMontant,
        ptzMotifInegibilite: result.ptzMotifInegibilite,
        budgetTotalAvecPtz: result.budgetTotalAvecPtz,
        cibleMensualite: result.cibleMensualite,
        cibleMargeMensuelle: result.cibleMargeMensuelle,
        cibleApportSupplementaire: result.cibleApportSupplementaire,
        createdById: req.user!.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    await logAudit(req.user!.id, 'CREATE', 'FinancialSimulation', simulation.id, { contactId: data.contactId })
    res.status(201).json(simulation)
  }),
)

const relinkSchema = z.object({ contactId: z.string().nullable().optional(), label: z.string().optional() })

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = relinkSchema.parse(req.body)
    const simulation = await prisma.financialSimulation.update({
      where: { id: req.params.id },
      data,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    await logAudit(req.user!.id, 'UPDATE', 'FinancialSimulation', simulation.id, data)
    res.json(simulation)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.financialSimulation.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'FinancialSimulation', req.params.id)
    res.status(204).end()
  }),
)

export default router
