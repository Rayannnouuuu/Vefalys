import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { logAudit } from '../lib/audit'
import { PERMISSION_DEFS, getPermissionsMap } from '../lib/permissions'

const router = Router()
router.use(authenticate)

// Lecture ouverte a tous les authentifies : le frontend en a besoin pour afficher/masquer les
// actions des collaborateurs (meilleure UX que de les laisser cliquer puis se prendre un 403).
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const map = await getPermissionsMap()
    res.json(PERMISSION_DEFS.map((def) => ({ key: def.key, label: def.label, enabled: map[def.key] })))
  }),
)

const updateSchema = z.object({ enabled: z.boolean() })

router.patch(
  '/:key',
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const def = PERMISSION_DEFS.find((d) => d.key === req.params.key)
    if (!def) throw new HttpError(404, 'Permission inconnue')
    const { enabled } = updateSchema.parse(req.body)
    const permission = await prisma.permission.upsert({
      where: { key: req.params.key },
      update: { enabled },
      create: { key: req.params.key, enabled },
    })
    await logAudit(req.user!.id, 'UPDATE', 'Permission', permission.id, { key: permission.key, enabled })
    res.json({ key: permission.key, label: def.label, enabled: permission.enabled })
  }),
)

export default router
