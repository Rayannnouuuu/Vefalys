const CALENDLY_API = 'https://api.calendly.com'

export class CalendlyApiError extends Error {}

async function calendlyFetch(path: string, token: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${CALENDLY_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new CalendlyApiError(`Calendly API ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

export async function getCalendlyCurrentUser(token: string) {
  const data = await calendlyFetch('/users/me', token)
  return data.resource as { uri: string; name: string; email: string; current_organization: string }
}

export async function listCalendlyScheduledEvents(token: string, userUri: string, minStartTime: string, maxStartTime: string) {
  const events: any[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minStartTime,
      max_start_time: maxStartTime,
      status: 'active',
      count: '100',
    })
    if (pageToken) params.set('page_token', pageToken)
    const data = await calendlyFetch(`/scheduled_events?${params.toString()}`, token)
    events.push(...data.collection)
    pageToken = data.pagination?.next_page_token || undefined
  } while (pageToken)
  return events as Array<{
    uri: string
    name: string
    status: string
    start_time: string
    end_time: string
    location?: { type?: string; location?: string }
  }>
}

export async function listCalendlyEventInvitees(token: string, eventUri: string) {
  const eventUuid = eventUri.split('/').pop()
  const data = await calendlyFetch(`/scheduled_events/${eventUuid}/invitees`, token)
  return data.collection as Array<{ name: string; email: string }>
}

export async function createCalendlyWebhookSubscription(token: string, userUri: string, organizationUri: string, callbackUrl: string) {
  const data = await calendlyFetch('/webhook_subscriptions', token, {
    method: 'POST',
    body: JSON.stringify({
      url: callbackUrl,
      events: ['invitee.created', 'invitee.canceled'],
      organization: organizationUri,
      user: userUri,
      scope: 'user',
    }),
  })
  return data.resource as { uri: string; signing_key?: string }
}

export async function deleteCalendlyWebhookSubscription(token: string, subscriptionUri: string) {
  const uuid = subscriptionUri.split('/').pop()
  await fetch(`${CALENDLY_API}/webhook_subscriptions/${uuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
