import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarColor: true } } },
    })
    res.json(logs)
  }),
)

export default router
