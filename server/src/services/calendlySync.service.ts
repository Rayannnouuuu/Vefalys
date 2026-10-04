import { prisma } from '../lib/prisma'
import { listCalendlyScheduledEvents, listCalendlyEventInvitees, CalendlyApiError } from '../lib/calendly'
import type { CalendlyIntegration } from '@prisma/client'

// Calendly ne garde pas de "titre" de contact directement sur l'evenement ; on va chercher
// l'invite (email) pour tenter de relier le RDV a un Contact existant.
async function findContactByEmail(email?: string) {
  if (!email) return null
  return prisma.contact.findFirst({ where: { email } })
}

// Synchronise le calendrier personnel d'UN collaborateur. Chaque rendez-vous importe est
// attribue a ce collaborateur (Appointment.createdById) pour que l'equipe - et l'admin dans sa
// vue globale - sache de quel calendrier il provient.
export async function syncCalendlyIntegration(integration: CalendlyIntegration): Promise<{ synced: number; skipped: number }> {
  const now = new Date()
  const minStartTime = new Date(now.getTime() - 7 * 86400000).toISOString()
  const maxStartTime = new Date(now.getTime() + 60 * 86400000).toISOString()

  let events
  try {
    events = await listCalendlyScheduledEvents(integration.accessToken, integration.calendlyUserUri, minStartTime, maxStartTime)
  } catch (err) {
    if (err instanceof CalendlyApiError) {
      console.error(`Calendly sync failed for integration ${integration.id}:`, err.message)
      return { synced: 0, skipped: 0 }
    }
    throw err
  }

  let synced = 0
  let skipped = 0

  for (const event of events) {
    try {
      const invitees = await listCalendlyEventInvitees(integration.accessToken, event.uri)
      const primaryInvitee = invitees[0]
      const contact = await findContactByEmail(primaryInvitee?.email)

      await prisma.appointment.upsert({
        where: { calendlyEventUri: event.uri },
        update: {
          title: event.name,
          startAt: new Date(event.start_time),
          endAt: new Date(event.end_time),
          location: event.location?.location || event.location?.type || null,
          contactId: contact?.id,
          createdById: integration.connectedById,
        },
        create: {
          title: event.name,
          type: 'VISIO',
          startAt: new Date(event.start_time),
          endAt: new Date(event.end_time),
          location: event.location?.location || event.location?.type || null,
          contactId: contact?.id,
          calendlyEventUri: event.uri,
          source: 'CALENDLY',
          reminderMinutesBefore: 60,
          createdById: integration.connectedById,
        },
      })
      synced++
    } catch {
      skipped++
    }
  }

  await prisma.calendlyIntegration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date() } })
  return { synced, skipped }
}

export async function syncCalendlyForUser(userId: string): Promise<{ synced: number; skipped: number }> {
  const integration = await prisma.calendlyIntegration.findUnique({ where: { connectedById: userId } })
  if (!integration) return { synced: 0, skipped: 0 }
  return syncCalendlyIntegration(integration)
}

export async function syncAllCalendlyIntegrations(): Promise<{ synced: number; skipped: number; integrations: number }> {
  const integrations = await prisma.calendlyIntegration.findMany()
  let synced = 0
  let skipped = 0
  for (const integration of integrations) {
    const result = await syncCalendlyIntegration(integration)
    synced += result.synced
    skipped += result.skipped
  }
  return { synced, skipped, integrations: integrations.length }
}

export async function cancelCalendlyAppointment(eventUri: string) {
  await prisma.appointment.deleteMany({ where: { calendlyEventUri: eventUri } })
}
