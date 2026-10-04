import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'

export interface AuthedRequest extends Request {
  user?: { id: string; role: string; email: string; firstName: string; lastName: string }
}

export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' })
  }
  try {
    const payload = verifyToken(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    // Verification de defense en profondeur : un jeton deja emis doit cesser de fonctionner
    // si le compte est ensuite desactive, refuse, ou si son statut d'approbation change,
    // meme si le jeton JWT reste cryptographiquement valide jusqu'a son expiration.
    if (!user || !user.isActive || user.approvalStatus !== 'APPROVED') {
      return res.status(401).json({ error: 'Session invalide' })
    }
    req.user = { id: user.id, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName }
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expire' })
  }
}

// ADMIN peut tout faire. MANAGER gere l'equipe et la donnee commerciale/comptable.
// COLLABORATEUR est restreint par requireRole quand precise sur une route sensible.
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentification requise' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }
    next()
  }
}
