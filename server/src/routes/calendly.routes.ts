import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler, HttpError } from '../middleware/errorHandler'
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth'
import { getCalendlyCurrentUser, createCalendlyWebhookSubscription, deleteCalendlyWebhookSubscription, CalendlyApiError } from '../lib/calendly'
import { syncCalendlyEvents, cancelCalendlyAppointment } from '../services/calendlySync.service'
import { logAudit } from '../lib/audit'

const router = Router()

// --- Webhook public (appele par Calendly, pas d'auth utilisateur) ---
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const integration = await prisma.calendlyIntegration.findFirst()
    if (integration?.webhookSubscriptionUri) {
      const signatureHeader = req.headers['calendly-webhook-signature'] as string | undefined
      const signingKey = integration.signingKey
      if (signingKey && signatureHeader) {
        const parts = Object.fromEntries(signatureHeader.split(',').map((p) => p.split('=')))
        const expected = crypto
          .createHmac('sha256', signingKey)
          .update(`${parts.t}.${(req as any).rawBody}`)
          .digest('hex')
        if (expected !== parts.v1) {
          throw new HttpError(401, 'Signature webhook invalide')
        }
      }
    }

    const event = req.body?.event
    const payload = req.body?.payload
    if (event === 'invitee.created' && payload?.event) {
      await syncCalendlyEvents()
    } else if (event === 'invitee.canceled' && payload?.event?.uri) {
      await cancelCalendlyAppointment(payload.event.uri)
    }
    res.status(200).json({ ok: true })
  }),
)

router.use(authenticate)

router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const integration = await prisma.calendlyIntegration.findFirst()
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

const connectSchema = z.object({ accessToken: z.string().min(10) })

router.post(
  '/connect',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { accessToken } = connectSchema.parse(req.body)

    let calendlyUser
    try {
      calendlyUser = await getCalendlyCurrentUser(accessToken)
    } catch (err) {
      if (err instanceof CalendlyApiError) throw new HttpError(400, 'Jeton Calendly invalide ou expire')
      throw err
    }

    await prisma.calendlyIntegration.deleteMany({})

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

    const integration = await prisma.calendlyIntegration.create({
      data: {
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

    const result = await syncCalendlyEvents()

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
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const integration = await prisma.calendlyIntegration.findFirst()
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
  asyncHandler(async (_req, res) => {
    const result = await syncCalendlyEvents()
    res.json(result)
  }),
)

export default router
