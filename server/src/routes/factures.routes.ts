import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { FACTURE_STATUSES, PAIEMENT_METHODS } from '../lib/enums'
import { generateFactureNumber } from '../lib/numbering'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

function computeTotals(items: { quantity: number; unitPrice: number; vatRate: number }[]) {
  const totalHT = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const totalTTC = items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 + i.vatRate / 100), 0)
  return { totalHT: Math.round(totalHT * 100) / 100, totalTTC: Math.round(totalTTC * 100) / 100 }
}

function withComputed(f: any) {
  const totals = computeTotals(f.items)
  const paid = (f.paiements || []).reduce((s: number, p: any) => s + p.amount, 0)
  return { ...f, ...totals, paid: Math.round(paid * 100) / 100, remaining: Math.round((totals.totalTTC - paid) * 100) / 100 }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, contactId, overdue } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (contactId) where.contactId = contactId
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() }
      where.status = { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'IMPAYEE'] }
    }
    const factures = await prisma.facture.findMany({
      where,
      include: { contact: { select: { id: true, firstName: true, lastName: true, company: true } }, items: true, paiements: true },
      orderBy: { issueDate: 'desc' },
    })
    res.json(factures.map(withComputed))
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const facture = await prisma.facture.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        items: true,
        paiements: { orderBy: { date: 'desc' } },
      },
    })
    if (!facture) throw new HttpError(404, 'Facture introuvable')
    res.json(withComputed(facture))
  }),
)

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number(),
  vatRate: z.number().nonnegative().default(20),
})

const createSchema = z.object({
  contactId: z.string(),
  opportunityId: z.string().optional(),
  promoterName: z.string().optional(),
  reference: z.string().optional(),
  attachmentPath: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const number = await generateFactureNumber()
    const facture = await prisma.facture.create({
      data: {
        number,
        contactId: data.contactId,
        opportunityId: data.opportunityId,
        promoterName: data.promoterName,
        reference: data.reference,
        attachmentPath: data.attachmentPath,
        status: data.attachmentPath ? 'ENVOYEE' : 'BROUILLON',
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: data.notes,
        createdById: req.user!.id,
        items: { create: data.items },
      },
      include: { items: true, paiements: true },
    })
    await logAudit(req.user!.id, 'CREATE', 'Facture', facture.id, { number })
    res.status(201).json(withComputed(facture))
  }),
)

const updateSchema = z.object({
  status: z.enum(FACTURE_STATUSES).optional(),
  promoterName: z.string().optional(),
  reference: z.string().optional(),
  attachmentPath: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).optional(),
})

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = updateSchema.parse(req.body)
    const { items, ...rest } = data
    if (items) {
      await prisma.factureItem.deleteMany({ where: { factureId: req.params.id } })
    }
    const facture = await prisma.facture.update({
      where: { id: req.params.id },
      data: { ...rest, items: items ? { create: items } : undefined },
      include: { items: true, paiements: true },
    })
    await logAudit(req.user!.id, 'UPDATE', 'Facture', facture.id, rest)
    res.json(withComputed(facture))
  }),
)

// --- Paiements ---
const paiementSchema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date().optional(),
  method: z.enum(PAIEMENT_METHODS),
  note: z.string().optional(),
})

router.post(
  '/:id/paiements',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = paiementSchema.parse(req.body)
    const facture = await prisma.facture.findUnique({ where: { id: req.params.id }, include: { items: true, paiements: true } })
    if (!facture) throw new HttpError(404, 'Facture introuvable')

    await prisma.paiement.create({ data: { ...data, factureId: facture.id } })

    const totals = computeTotals(facture.items)
    const totalPaid = facture.paiements.reduce((s, p) => s + p.amount, 0) + data.amount
    const newStatus = totalPaid >= totals.totalTTC ? 'PAYEE' : totalPaid > 0 ? 'PARTIELLEMENT_PAYEE' : facture.status
    const updated = await prisma.facture.update({
      where: { id: facture.id },
      data: { status: newStatus },
      include: { items: true, paiements: true },
    })
    if (newStatus === 'PAYEE') {
      await prisma.commission.updateMany({ where: { factureId: facture.id }, data: { status: 'PAYEE' } })
    }
    await logAudit(req.user!.id, 'PAYMENT', 'Facture', facture.id, data)
    res.status(201).json(withComputed(updated))
  }),
)

// --- Avoir (facture corrective) ---
router.post(
  '/:id/avoir',
  asyncHandler(async (req: AuthedRequest, res) => {
    const original = await prisma.facture.findUnique({ where: { id: req.params.id }, include: { items: true } })
    if (!original) throw new HttpError(404, 'Facture introuvable')
    const number = await generateFactureNumber()
    const avoir = await prisma.facture.create({
      data: {
        number,
        contactId: original.contactId,
        isAvoir: true,
        originalFactureId: original.id,
        status: 'ENVOYEE',
        notes: `Avoir sur facture ${original.number}`,
        createdById: req.user!.id,
        items: {
          create: original.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: -i.unitPrice, vatRate: i.vatRate })),
        },
      },
      include: { items: true, paiements: true },
    })
    await logAudit(req.user!.id, 'CREATE_AVOIR', 'Facture', avoir.id, { originalFactureId: original.id })
    res.status(201).json(withComputed(avoir))
  }),
)

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.facture.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Facture', req.params.id)
    res.status(204).end()
  }),
)

export default router
