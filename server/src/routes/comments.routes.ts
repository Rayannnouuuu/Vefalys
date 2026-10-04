import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { createNotification } from '../lib/notifications'

const router = Router()
router.use(authenticate)

router.get(
  '/:contactId',
  asyncHandler(async (req, res) => {
    const comments = await prisma.comment.findMany({
      where: { contactId: req.params.contactId },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarColor: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(comments)
  }),
)

const createSchema = z.object({ contactId: z.string(), body: z.string().min(1) })

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = createSchema.parse(req.body)
    const comment = await prisma.comment.create({
      data: { ...data, userId: req.user!.id },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarColor: true } } },
    })

    // Notifie le proprietaire du contact (si different de l'auteur du commentaire)
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } })
    if (contact?.ownerId && contact.ownerId !== req.user!.id) {
      await createNotification(
        contact.ownerId,
        'SYSTEME',
        'Nouveau commentaire',
        `${req.user!.firstName} ${req.user!.lastName} a commente ${contact.firstName} ${contact.lastName}`,
        `/contacts/${contact.id}`,
      )
    }
    res.status(201).json(comment)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.comment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export default router
