import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { uploadFileFilter } from '../lib/uploadFilter'

const router = Router()
router.use(authenticate)

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).slice(0, 10)
    cb(null, `${crypto.randomUUID()}${safeExt}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: uploadFileFilter })

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) throw new HttpError(400, 'Aucun fichier recu')
    const { contactId, opportunityId, depenseId, prospectProgramId } = req.body as Record<string, string>

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user!.id,
        contactId: contactId || undefined,
        opportunityId: opportunityId || undefined,
        depenseId: depenseId || undefined,
        prospectProgramId: prospectProgramId || undefined,
      },
    })
    res.status(201).json(attachment)
  }),
)

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.attachment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

// Upload "brut" : renvoie juste le chemin, sans creer d'enregistrement Attachment.
// Utilise pour les documents de programme (plans, DPE...) et les justificatifs de depense,
// qui stockent directement un champ `path` plutot qu'une relation Attachment.
router.post(
  '/raw',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Aucun fichier recu')
    res.status(201).json({ path: `/uploads/${req.file.filename}`, filename: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size })
  }),
)

export default router
