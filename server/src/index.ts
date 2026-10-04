import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import { verifyToken } from './lib/jwt'
import { attachSocketServer } from './lib/notifications'
import { errorHandler } from './middleware/errorHandler'
import { runNotificationSweep } from './services/notificationEngine'
import { syncAllCalendlyIntegrations } from './services/calendlySync.service'
import { prisma } from './lib/prisma'

import authRoutes from './routes/auth.routes'
import usersRoutes from './routes/users.routes'
import contactsRoutes from './routes/contacts.routes'
import tagsRoutes from './routes/tags.routes'
import interactionsRoutes from './routes/interactions.routes'
import relancesRoutes from './routes/relances.routes'
import opportunitiesRoutes from './routes/opportunities.routes'
import programsRoutes from './routes/programs.routes'
import prospectProgramsRoutes from './routes/prospectPrograms.routes'
import devisRoutes from './routes/devis.routes'
import facturesRoutes from './routes/factures.routes'
import depensesRoutes from './routes/depenses.routes'
import tasksRoutes from './routes/tasks.routes'
import appointmentsRoutes from './routes/appointments.routes'
import notificationsRoutes from './routes/notifications.routes'
import dashboardRoutes from './routes/dashboard.routes'
import searchRoutes from './routes/search.routes'
import uploadsRoutes from './routes/uploads.routes'
import calendlyRoutes from './routes/calendly.routes'
import documentsRoutes from './routes/documents.routes'
import commentsRoutes from './routes/comments.routes'
import financialSimulationsRoutes from './routes/financialSimulations.routes'
import permissionsRoutes from './routes/permissions.routes'
import auditRoutes from './routes/audit.routes'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } })
attachSocketServer(io)

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token
  if (token) {
    try {
      const payload = verifyToken(token)
      socket.join(`user:${payload.userId}`)
    } catch {
      // socket reste non authentifie, pas de room jointe
    }
  }
})

app.use(
  helmet({
    // API JSON pure : la CSP par defaut est pensee pour du HTML, elle n'apporte rien ici et peut
    // gener des usages futurs ; le frontend etant sur une autre origine, on autorise explicitement
    // le chargement cross-origin des fichiers statiques (/uploads).
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(
  express.json({
    limit: '5mb',
    // Conserve le corps brut pour la verification de signature des webhooks Calendly
    verify: (req, _res, buf) => {
      ;(req as any).rawBody = buf.toString('utf8')
    },
  }),
)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Limite generale : protege contre les abus / scraping (300 requetes / 15 min / IP)
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
// Limite stricte sur les routes d'authentification : freine les attaques par force brute
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, reessayez dans quelques minutes.' },
})
app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/resend-verification', authLimiter)
app.use('/api/auth/verify-email', authLimiter)
app.use('/api/users/me/change-password', authLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/contacts', contactsRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/interactions', interactionsRoutes)
app.use('/api/relances', relancesRoutes)
app.use('/api/opportunities', opportunitiesRoutes)
app.use('/api/programs', programsRoutes)
app.use('/api/prospect-programs', prospectProgramsRoutes)
app.use('/api/devis', devisRoutes)
app.use('/api/factures', facturesRoutes)
app.use('/api/depenses', depensesRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/uploads', uploadsRoutes)
app.use('/api/calendly', calendlyRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/financial-simulations', financialSimulationsRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/audit', auditRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

// Garde-fou de demarrage : refuse de lancer l'API en production avec le secret JWT de
// developpement ou une URL client encore pointee sur localhost - erreurs de configuration
// frequentes qui compromettraient la securite de tous les comptes.
function assertProductionConfigSafe() {
  if (process.env.NODE_ENV !== 'production') return
  const problems: string[] = []
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev-secret') || process.env.JWT_SECRET.includes('CHANGE_ME')) {
    problems.push('JWT_SECRET utilise encore une valeur de developpement/placeholder. Generez un secret fort (voir .env.example).')
  }
  if (!process.env.CLIENT_URL || process.env.CLIENT_URL.includes('localhost')) {
    problems.push('CLIENT_URL pointe encore vers localhost. Definissez l\'URL publique reelle du frontend.')
  }
  if (problems.length) {
    console.error('Configuration de production invalide :\n' + problems.map((p) => `  - ${p}`).join('\n'))
    process.exit(1)
  }
}
assertProductionConfigSafe()

async function pollCalendlyIfConnected() {
  const count = await prisma.calendlyIntegration.count()
  if (count > 0) {
    await syncAllCalendlyIntegrations().catch((e) => console.error('calendly sync failed', e))
  }
}

const PORT = Number(process.env.PORT) || 4000
server.listen(PORT, () => {
  console.log(`API disponible sur http://localhost:${PORT}`)
  runNotificationSweep().catch((e) => console.error('notification sweep failed', e))
  setInterval(() => runNotificationSweep().catch((e) => console.error('notification sweep failed', e)), 15 * 60 * 1000)
  pollCalendlyIfConnected()
  setInterval(pollCalendlyIfConnected, 10 * 60 * 1000)
})
