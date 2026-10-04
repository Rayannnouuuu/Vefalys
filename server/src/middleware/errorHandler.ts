import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { MulterError } from 'multer'

export function asyncHandler<T extends (req: any, res: Response, next: NextFunction) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Donnees invalides', details: err.flatten() })
  }
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'Cette ressource existe deja (contrainte unique)' })
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource introuvable' })
  }
  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (10 Mo maximum).' : err.message
    return res.status(400).json({ error: message })
  }
  if (err instanceof Error && err.message?.startsWith('Type de fichier non autorise')) {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  const status = err?.status || 500
  // En production, les erreurs non anticipees (status 500) ne doivent pas exposer de details
  // internes au client ; seules les erreurs explicitement levees avec un status (HttpError) le font.
  const exposeMessage = status !== 500 || process.env.NODE_ENV !== 'production'
  res.status(status).json({ error: exposeMessage ? err?.message || 'Erreur interne du serveur' : 'Erreur interne du serveur' })
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
