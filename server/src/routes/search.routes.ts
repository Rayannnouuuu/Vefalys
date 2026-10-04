import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ contacts: [], opportunities: [], factures: [], programs: [] })

    const [contacts, opportunities, factures, programs] = await Promise.all([
      prisma.contact.findMany({
        where: {
          OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }],
        },
        take: 8,
      }),
      prisma.opportunity.findMany({ where: { title: { contains: q } }, take: 8, include: { contact: true } }),
      prisma.facture.findMany({ where: { number: { contains: q } }, take: 8, include: { contact: true } }),
      prisma.program.findMany({ where: { name: { contains: q } }, take: 8 }),
    ])

    res.json({ contacts, opportunities, factures, programs })
  }),
)

export default router
