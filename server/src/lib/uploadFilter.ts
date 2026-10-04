import type { Request } from 'express'
import type { FileFilterCallback } from 'multer'

// Types de fichiers acceptes pour les uploads (documents, justificatifs, factures importees).
// Volontairement restreint : pas d'executables, pas de scripts, pas de SVG (vecteur XSS stocke).
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
])

export function uploadFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Type de fichier non autorise : ${file.mimetype}`))
  }
}
