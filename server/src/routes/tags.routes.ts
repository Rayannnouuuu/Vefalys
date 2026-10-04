import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.tag.findMany({ orderBy: { name: 'asc' } }))
  }),
)

const tagSchema = z.object({ name: z.string().min(1), color: z.string().optional() })

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = tagSchema.parse(req.body)
    const tag = await prisma.tag.create({ data })
    res.status(201).json(tag)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.tag.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export default router
