import type { Response, NextFunction } from 'express'
import { prisma } from './prisma'
import type { AuthedRequest } from '../middleware/auth'

// ADMIN et MANAGER gardent leurs droits actuels (comportement historique, jamais restreint
// ici). Ces cles etendent ou non les droits du role COLLABORATEUR au-dela de sa restriction
// par defaut. `enabled` ci-dessous est la valeur appliquee tant qu'aucune ligne Permission
// n'existe encore en base pour cette cle (premiere utilisation de l'app).
export const PERMISSION_DEFS = [
  { key: 'COLLAB_DELETE_CONTACTS', label: 'Supprimer des contacts', enabled: false },
  { key: 'COLLAB_ANONYMIZE_CONTACTS', label: 'Anonymiser des contacts (RGPD)', enabled: false },
  { key: 'COLLAB_DELETE_OPPORTUNITIES', label: 'Supprimer des opportunites du pipeline', enabled: false },
  { key: 'COLLAB_DELETE_FACTURES', label: 'Supprimer des factures', enabled: false },
  { key: 'COLLAB_DELETE_DEPENSES', label: 'Supprimer des depenses', enabled: false },
  { key: 'COLLAB_VIEW_FINANCES', label: "Consulter la vue financiere (CA, tresorerie, marges)", enabled: false },
] as const

export type PermissionKey = (typeof PERMISSION_DEFS)[number]['key']

export async function getPermissionsMap(): Promise<Record<string, boolean>> {
  const rows = await prisma.permission.findMany()
  const overrides = new Map(rows.map((r) => [r.key, r.enabled]))
  const map: Record<string, boolean> = {}
  for (const def of PERMISSION_DEFS) {
    map[def.key] = overrides.has(def.key) ? overrides.get(def.key)! : def.enabled
  }
  return map
}

export async function collabCan(key: PermissionKey): Promise<boolean> {
  const row = await prisma.permission.findUnique({ where: { key } })
  if (row) return row.enabled
  return PERMISSION_DEFS.find((d) => d.key === key)?.enabled ?? false
}

// ADMIN/MANAGER passent toujours. COLLABORATEUR passe uniquement si la permission est activee.
export function requirePermission(key: PermissionKey) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentification requise' })
    if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') return next()
    const allowed = await collabCan(key)
    if (!allowed) return res.status(403).json({ error: 'Permissions insuffisantes' })
    next()
  }
}
