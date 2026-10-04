import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(notifications)
  }),
)

router.patch(
  '/:id/read',
  asyncHandler(async (req: AuthedRequest, res) => {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })
    res.json(notification)
  }),
)

router.post(
  '/read-all',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } })
    res.status(204).end()
  }),
)

export default router
