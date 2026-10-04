import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { DEPENSE_CATEGORIES } from '../lib/enums'
import { logAudit } from '../lib/audit'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, from, to } = req.query as Record<string, string>
    const where: any = {}
    if (category) where.category = category
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    const depenses = await prisma.depense.findMany({ where, orderBy: { date: 'desc' } })
    res.json(depenses)
  }),
)

const createSchema = z.object({
  category: z.enum(DEPENSE_CATEGORIES),
  amount: z.number().positive(),
  date: z.coerce.date().optional(),
  description: z.string().optional(),
  accountingCode: z.string().optional(),
  receiptPath: z.string().optional(),
})

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const depense = await prisma.depense.create({ data: { ...data, createdById: req.user!.id } })
    await logAudit(req.user!.id, 'CREATE', 'Depense', depense.id, { amount: depense.amount })
    res.status(201).json(depense)
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.partial().parse(req.body)
    const depense = await prisma.depense.update({ where: { id: req.params.id }, data })
    await logAudit(req.user!.id, 'UPDATE', 'Depense', depense.id, data)
    res.json(depense)
  }),
)

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.depense.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Depense', req.params.id)
    res.status(204).end()
  }),
)

// --- Budgets par categorie ---
router.get(
  '/budgets/all',
  asyncHandler(async (req, res) => {
    const { year, month } = req.query as Record<string, string>
    const where: any = {}
    if (year) where.year = Number(year)
    if (month) where.month = Number(month)
    res.json(await prisma.budget.findMany({ where }))
  }),
)

const budgetSchema = z.object({
  category: z.enum(DEPENSE_CATEGORIES),
  amount: z.number().nonnegative(),
  year: z.number(),
  month: z.number().min(1).max(12),
})

router.post(
  '/budgets',
  asyncHandler(async (req, res) => {
    const data = budgetSchema.parse(req.body)
    const budget = await prisma.budget.upsert({
      where: { category_year_month: { category: data.category, year: data.year, month: data.month } },
      update: { amount: data.amount },
      create: data,
    })
    res.status(201).json(budget)
  }),
)

export default router
