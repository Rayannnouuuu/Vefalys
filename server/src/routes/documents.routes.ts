import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { PROSPECT_DOCUMENT_TYPES } from '../lib/enums'
import { logAudit } from '../lib/audit'
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
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: uploadFileFilter })

router.get(
  '/:contactId',
  asyncHandler(async (req, res) => {
    const documents = await prisma.prospectDocument.findMany({
      where: { contactId: req.params.contactId },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { uploadedAt: 'desc' },
    })
    res.json(documents)
  }),
)

const createSchema = z.object({
  contactId: z.string(),
  name: z.string().min(1),
  type: z.enum(PROSPECT_DOCUMENT_TYPES),
})

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) throw new HttpError(400, 'Aucun fichier recu')
    const data = createSchema.parse({ contactId: req.body.contactId, name: req.body.name || req.file.originalname, type: req.body.type })
    const document = await prisma.prospectDocument.create({
      data: {
        contactId: data.contactId,
        name: data.name,
        type: data.type,
        filePath: `/uploads/${req.file.filename}`,
        uploadedById: req.user!.id,
      },
    })
    await logAudit(req.user!.id, 'CREATE', 'ProspectDocument', document.id, { contactId: data.contactId, type: data.type })
    res.status(201).json(document)
  }),
)

router.delete(
  '/:docId',
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.prospectDocument.delete({ where: { id: req.params.docId } })
    await logAudit(req.user!.id, 'DELETE', 'ProspectDocument', req.params.docId)
    res.status(204).end()
  }),
)

export default router
