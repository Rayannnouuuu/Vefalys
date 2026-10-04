import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'
import { CONTACT_STATUSES, CONTACT_SOURCES } from '../lib/enums'

const router = Router()
router.use(authenticate)

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  sector: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(CONTACT_STATUSES).optional(),
  source: z.enum(CONTACT_SOURCES).optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  typologieRecherchee: z.string().optional(),
  localisationSouhaitee: z.string().optional(),
  financement: z.string().optional(),
  criteresNotes: z.string().optional(),
  mandatSigned: z.boolean().optional(),
  mandatSignedDate: z.coerce.date().optional(),
  financingProofUploaded: z.boolean().optional(),
  financingProofDate: z.coerce.date().optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search, tagId, source, archived } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (source) where.source = source
    where.archivedAt = archived === 'true' ? { not: null } : null
    if (tagId) where.tags = { some: { tagId } }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ]
    }
    const contacts = await prisma.contact.findMany({
      where,
      include: { tags: { include: { tag: true } }, owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(contacts)
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        tags: { include: { tag: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        interactions: { orderBy: { occurredAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
        opportunities: true,
        relances: { orderBy: { dueDate: 'asc' } },
        tasks: { orderBy: { dueDate: 'asc' } },
        appointments: { orderBy: { startAt: 'asc' } },
        attachments: true,
        factures: { orderBy: { issueDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' }, include: { uploadedBy: { select: { firstName: true, lastName: true } } } },
        comments: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true, avatarColor: true } } } },
      },
    })
    if (!contact) throw new HttpError(404, 'Contact introuvable')
    res.json(contact)
  }),
)

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = contactSchema.parse(req.body)
    const { tagIds, ...rest } = data
    const contact = await prisma.contact.create({
      data: {
        ...rest,
        email: rest.email || null,
        ownerId: rest.ownerId || req.user!.id,
        tags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: { tags: { include: { tag: true } } },
    })
    await logAudit(req.user!.id, 'CREATE', 'Contact', contact.id, { name: `${contact.firstName} ${contact.lastName}` })
    res.status(201).json(contact)
  }),
)

router.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = contactSchema.partial().parse(req.body)
    const { tagIds, ...rest } = data
    if (tagIds) {
      await prisma.contactTag.deleteMany({ where: { contactId: req.params.id } })
    }
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        email: rest.email === '' ? null : rest.email,
        tags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: { tags: { include: { tag: true } } },
    })
    await logAudit(req.user!.id, 'UPDATE', 'Contact', contact.id, data)
    res.json(contact)
  }),
)

router.post(
  '/:id/archive',
  asyncHandler(async (req: AuthedRequest, res) => {
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: { archivedAt: new Date() } })
    await logAudit(req.user!.id, 'ARCHIVE', 'Contact', contact.id)
    res.json(contact)
  }),
)

router.post(
  '/:id/duplicate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const original = await prisma.contact.findUnique({ where: { id: req.params.id }, include: { tags: true } })
    if (!original) throw new HttpError(404, 'Contact introuvable')
    const copy = await prisma.contact.create({
      data: {
        firstName: original.firstName,
        lastName: `${original.lastName} (copie)`,
        email: null,
        phone: original.phone,
        company: original.company,
        sector: original.sector,
        location: original.location,
        status: 'PROSPECT_FROID',
        source: original.source,
        budgetMin: original.budgetMin,
        budgetMax: original.budgetMax,
        typologieRecherchee: original.typologieRecherchee,
        localisationSouhaitee: original.localisationSouhaitee,
        financement: original.financement,
        ownerId: req.user!.id,
        tags: { create: original.tags.map((t) => ({ tagId: t.tagId })) },
      },
      include: { tags: { include: { tag: true } } },
    })
    await logAudit(req.user!.id, 'DUPLICATE', 'Contact', copy.id, { originalId: original.id })
    res.status(201).json(copy)
  }),
)

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.contact.delete({ where: { id: req.params.id } })
    await logAudit(req.user!.id, 'DELETE', 'Contact', req.params.id)
    res.status(204).end()
  }),
)

// --- RGPD : export complet des donnees d'un contact ---
router.get(
  '/:id/export',
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        tags: { include: { tag: true } },
        interactions: true,
        opportunities: true,
        relances: true,
        tasks: true,
        appointments: true,
        factures: { include: { items: true, paiements: true } },
        documents: true,
        comments: true,
      },
    })
    if (!contact) throw new HttpError(404, 'Contact introuvable')
    res.setHeader('Content-Disposition', `attachment; filename="contact-${contact.id}.json"`)
    res.json(contact)
  }),
)

// --- RGPD : droit a l'oubli - anonymise les donnees personnelles, conserve l'historique financier legal ---
router.post(
  '/:id/anonymize',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.$transaction([
      prisma.prospectDocument.deleteMany({ where: { contactId: req.params.id } }),
      prisma.comment.deleteMany({ where: { contactId: req.params.id } }),
      prisma.interaction.deleteMany({ where: { contactId: req.params.id } }),
      prisma.contact.update({
        where: { id: req.params.id },
        data: {
          firstName: 'Anonymise',
          lastName: 'RGPD',
          email: null,
          phone: null,
          company: null,
          sector: null,
          location: null,
          notes: 'Donnees anonymisees suite a une demande RGPD.',
          criteresNotes: null,
          typologieRecherchee: null,
          localisationSouhaitee: null,
          financement: null,
          archivedAt: new Date(),
        },
      }),
    ])
    await logAudit(req.user!.id, 'ANONYMIZE', 'Contact', req.params.id)
    res.status(204).end()
  }),
)

// Import CSV : lignes deja parsees cote client, un objet JSON par contact
const importSchema = z.object({
  contacts: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      sector: z.string().optional(),
      location: z.string().optional(),
      source: z.enum(CONTACT_SOURCES).optional(),
    }),
  ),
})

router.post(
  '/import',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { contacts } = importSchema.parse(req.body)
    const created = await prisma.$transaction(
      contacts.map((c) =>
        prisma.contact.create({ data: { ...c, email: c.email || null, ownerId: req.user!.id } }),
      ),
    )
    await logAudit(req.user!.id, 'IMPORT', 'Contact', 'bulk', { count: created.length })
    res.status(201).json({ created: created.length })
  }),
)

export default router
