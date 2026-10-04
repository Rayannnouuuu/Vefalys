import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { getCalendlyCurrentUser, createCalendlyWebhookSubscription, deleteCalendlyWebhookSubscription, CalendlyApiError } from '../lib/calendly'
import { syncCalendlyForUser, syncAllCalendlyIntegrations, cancelCalendlyAppointment } from '../services/calendlySync.service'
import { logAudit } from '../lib/audit'

const router = Router()

// --- Webhook public (appele par Calendly, pas d'auth utilisateur) ---
// Chaque collaborateur a sa propre souscription webhook (signee avec sa propre cle), donc on
// essaie la signature contre chaque integration connue plutot que de supposer une seule
// integration globale. Sur un petit effectif d'equipe, le cout est negligeable.
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const integrations = await prisma.calendlyIntegration.findMany()
    const signatureHeader = req.headers['calendly-webhook-signature'] as string | undefined
    if (integrations.length && signatureHeader) {
      const parts = Object.fromEntries(signatureHeader.split(',').map((p) => p.split('=')))
      const matches = integrations.some((integration) => {
        if (!integration.signingKey) return false
        const expected = crypto
          .createHmac('sha256', integration.signingKey)
          .update(`${parts.t}.${(req as any).rawBody}`)
          .digest('hex')
        return expected === parts.v1
      })
      if (!matches) throw new HttpError(401, 'Signature webhook invalide')
    }

    const event = req.body?.event
    const payload = req.body?.payload
    if (event === 'invitee.created' && payload?.event) {
      await syncAllCalendlyIntegrations()
    } else if (event === 'invitee.canceled' && payload?.event?.uri) {
      await cancelCalendlyAppointment(payload.event.uri)
    }
    res.status(200).json({ ok: true })
  }),
)

router.use(authenticate)

router.get(
  '/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    const integration = await prisma.calendlyIntegration.findUnique({ where: { connectedById: req.user!.id } })
    if (!integration) return res.json({ connected: false })
    res.json({
      connected: true,
      userName: integration.calendlyUserName,
      userEmail: integration.calendlyUserEmail,
      lastSyncAt: integration.lastSyncAt,
      webhookActive: !!integration.webhookSubscriptionUri,
    })
  }),
)

// Vue d'ensemble pour l'administrateur : qui, dans l'equipe, a connecte son Calendly personnel.
router.get(
  '/team',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (_req, res) => {
    const [integrations, users] = await Promise.all([
      prisma.calendlyIntegration.findMany({ include: { connectedBy: { select: { id: true, firstName: true, lastName: true, avatarColor: true, role: true } } } }),
      prisma.user.findMany({ where: { isActive: true }, select: { id: true, firstName: true, lastName: true, avatarColor: true, role: true } }),
    ])
    const byUserId = new Map(integrations.map((i) => [i.connectedById, i]))
    const team = users.map((u) => {
      const integration = byUserId.get(u.id)
      return {
        user: u,
        connected: !!integration,
        calendlyUserName: integration?.calendlyUserName || null,
        calendlyUserEmail: integration?.calendlyUserEmail || null,
        lastSyncAt: integration?.lastSyncAt || null,
        webhookActive: !!integration?.webhookSubscriptionUri,
      }
    })
    res.json(team)
  }),
)

const connectSchema = z.object({ accessToken: z.string().min(10) })

// N'importe quel collaborateur peut connecter SON PROPRE compte Calendly (jeton personnel) :
// ce n'est plus reserve a l'admin/manager, chacun gere son propre calendrier.
router.post(
  '/connect',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { accessToken } = connectSchema.parse(req.body)

    let calendlyUser
    try {
      calendlyUser = await getCalendlyCurrentUser(accessToken)
    } catch (err) {
      if (err instanceof CalendlyApiError) throw new HttpError(400, 'Jeton Calendly invalide ou expire')
      throw err
    }

    const existing = await prisma.calendlyIntegration.findUnique({ where: { connectedById: req.user!.id } })
    if (existing?.webhookSubscriptionUri) {
      await deleteCalendlyWebhookSubscription(existing.accessToken, existing.webhookSubscriptionUri).catch(() => {})
    }

    let webhookSubscriptionUri: string | undefined
    let signingKey: string | undefined
    const publicUrl = process.env.PUBLIC_APP_URL
    if (publicUrl) {
      try {
        const sub = await createCalendlyWebhookSubscription(accessToken, calendlyUser.uri, calendlyUser.current_organization, `${publicUrl}/api/calendly/webhook`)
        webhookSubscriptionUri = sub.uri
        signingKey = sub.signing_key
      } catch (err) {
        console.warn('Calendly webhook subscription failed (sync manuel/periodique utilise a la place):', err)
      }
    }

    const integration = await prisma.calendlyIntegration.upsert({
      where: { connectedById: req.user!.id },
      update: {
        accessToken,
        calendlyUserUri: calendlyUser.uri,
        calendlyUserName: calendlyUser.name,
        calendlyUserEmail: calendlyUser.email,
        organizationUri: calendlyUser.current_organization,
        webhookSubscriptionUri,
        signingKey,
      },
      create: {
        accessToken,
        calendlyUserUri: calendlyUser.uri,
        calendlyUserName: calendlyUser.name,
        calendlyUserEmail: calendlyUser.email,
        organizationUri: calendlyUser.current_organization,
        webhookSubscriptionUri,
        signingKey,
        connectedById: req.user!.id,
      },
    })

    await logAudit(req.user!.id, 'CONNECT', 'CalendlyIntegration', integration.id, { user: calendlyUser.email })

    const result = await syncCalendlyForUser(req.user!.id)

    res.status(201).json({
      connected: true,
      userName: calendlyUser.name,
      userEmail: calendlyUser.email,
      webhookActive: !!webhookSubscriptionUri,
      initialSync: result,
    })
  }),
)

router.post(
  '/disconnect',
  asyncHandler(async (req: AuthedRequest, res) => {
    const integration = await prisma.calendlyIntegration.findUnique({ where: { connectedById: req.user!.id } })
    if (integration) {
      if (integration.webhookSubscriptionUri) {
        await deleteCalendlyWebhookSubscription(integration.accessToken, integration.webhookSubscriptionUri).catch(() => {})
      }
      await prisma.calendlyIntegration.delete({ where: { id: integration.id } })
      await logAudit(req.user!.id, 'DISCONNECT', 'CalendlyIntegration', integration.id)
    }
    res.status(204).end()
  }),
)

router.post(
  '/sync',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await syncCalendlyForUser(req.user!.id)
    res.json(result)
  }),
)

// Synchronise d'un coup les calendriers de tous les collaborateurs connectes.
router.post(
  '/sync-all',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (_req, res) => {
    const result = await syncAllCalendlyIntegrations()
    res.json(result)
  }),
)

export default router
