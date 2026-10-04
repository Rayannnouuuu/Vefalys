import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { DEVIS_STATUSES } from '../lib/enums'
import { generateDevisNumber, generateFactureNumber } from '../lib/numbering'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

function computeTotals(items: { quantity: number; unitPrice: number; vatRate: number }[]) {
  const totalHT = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const totalTTC = items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 + i.vatRate / 100), 0)
  return { totalHT: Math.round(totalHT * 100) / 100, totalTTC: Math.round(totalTTC * 100) / 100 }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, contactId } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (contactId) where.contactId = contactId
    const devis = await prisma.devis.findMany({
      where,
      include: { contact: { select: { id: true, firstName: true, lastName: true, company: true } }, items: true },
      orderBy: { issueDate: 'desc' },
    })
    res.json(devis.map((d) => ({ ...d, ...computeTotals(d.items) })))
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const devis = await prisma.devis.findUnique({
      where: { id: req.params.id },
      include: { contact: true, items: true, factures: true, opportunity: { select: { id: true, title: true } } },
    })
    if (!devis) throw new HttpError(404, 'Devis introuvable')
    res.json({ ...devis, ...computeTotals(devis.items) })
  }),
)

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().nonnegative().default(20),
})

const createSchema = z.object({
  contactId: z.string(),
  opportunityId: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const number = await generateDevisNumber()
    const devis = await prisma.devis.create({
      data: {
        number,
        contactId: data.contactId,
        opportunityId: data.opportunityId,
        validUntil: data.validUntil,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        createdById: req.user!.id,
        items: { create: data.items },
      },
      include: { items: true },
    })
    await logAudit(req.user!.id, 'CREATE', 'Devis', devis.id, { number })
    res.status(201).json({ ...devis, ...computeTotals(devis.items) })
  }),
)

const updateSchema = z.object({
  status: z.enum(DEVIS_STATUSES).optional(),
  validUntil: z.coerce.date().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).optional(),
})

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const { items, ...rest } = data
    if (items) {
      await prisma.devisItem.deleteMany({ where: { devisId: req.params.id } })
    }
    const devis = await prisma.devis.update({
      where: { id: req.params.id },
      data: { ...rest, items: items ? { create: items } : undefined },
      include: { items: true },
    })
    await logAudit(req.user!.id, 'UPDATE', 'Devis', devis.id, rest)
    res.json({ ...devis, ...computeTotals(devis.items) })
  }),
)

// Conversion devis accepte -> facture (un clic)
router.post(
  '/:id/convert',
  asyncHandler(async (req: AuthedRequest, res) => {
    const devis = await prisma.devis.findUnique({ where: { id: req.params.id }, include: { items: true, factures: true } })
    if (!devis) throw new HttpError(404, 'Devis introuvable')
    if (devis.factures.length) throw new HttpError(409, 'Ce devis a deja ete converti en facture')

    const number = await generateFactureNumber()
    const facture = await prisma.facture.create({
      data: {
        number,
        contactId: devis.contactId,
        devisId: devis.id,
        opportunityId: devis.opportunityId,
        status: 'BROUILLON',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: devis.notes,
        createdById: req.user!.id,
        items: { create: devis.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate })) },
      },
      include: { items: true },
    })
    await prisma.devis.update({ where: { id: devis.id }, data: { status: 'FACTURE' } })
    await logAudit(req.user!.id, 'CONVERT', 'Devis', devis.id, { factureId: facture.id })
    res.status(201).json({ ...facture, ...computeTotals(facture.items) })
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.devis.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Devis', req.params.id)
    res.status(204).end()
  }),
)

export default router
