import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCw, Link2Off } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, Button, Input, Label } from '../../components/ui'
import { useAuthStore } from '../../store/auth'
import { SettingsSection } from './SettingsLayout'

export default function CalendlySettingsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

  return (
    <>
      <SettingsSection
        title="Calendly - mon calendrier"
        description="Connectez votre propre compte Calendly pour que vos rendez-vous pris en ligne remontent automatiquement dans l'Agenda partage."
      >
        <PersonalCalendlyCard />
      </SettingsSection>
      {isManager && (
        <SettingsSection title="Calendly - equipe" description="Etat de connexion de chaque collaborateur.">
          <TeamCalendlyCard />
        </SettingsSection>
      )}
    </>
  )
}

function PersonalCalendlyCard() {
  const queryClient = useQueryClient()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: status } = useQuery({ queryKey: ['calendly', 'status'], queryFn: () => api.get('/calendly/status').then((r) => r.data) })

  async function connect(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/calendly/connect', { accessToken: token })
      setToken('')
      queryClient.invalidateQueries({ queryKey: ['calendly', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['calendly', 'team'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    await api.post('/calendly/disconnect')
    queryClient.invalidateQueries({ queryKey: ['calendly', 'status'] })
    queryClient.invalidateQueries({ queryKey: ['calendly', 'team'] })
  }

  async function syncNow() {
    setLoading(true)
    try {
      await api.post('/calendly/sync')
      queryClient.invalidateQueries({ queryKey: ['calendly', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      {!status?.connected && (
        <>
          <p className="mb-3 text-sm text-brand-400">
            Recuperez votre jeton d'acces personnel depuis Calendly (Integrations &gt; API &amp; Webhooks &gt; Your personal access tokens),
            puis collez-le ici. Chaque collaborateur connecte le sien, independamment des autres.
          </p>
          <form onSubmit={connect} className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Jeton d'acces personnel Calendly</Label>
              <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJraWQiOi..." required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Connecter'}</Button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
      {status?.connected && (
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Connecte en tant que {status.userName} ({status.userEmail})
          </p>
          <p className="text-brand-400">
            {status.webhookActive
              ? 'Synchronisation en temps reel active (webhook).'
              : "Synchronisation via sondage periodique (toutes les 10 min) - le webhook temps reel necessite un deploiement avec une URL publique."}
          </p>
          {status.lastSyncAt && (
            <p className="text-brand-400">Derniere synchronisation : {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true, locale: fr })}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={syncNow} disabled={loading}><RefreshCw size={14} /> Synchroniser maintenant</Button>
            <Button variant="ghost" onClick={disconnect}><Link2Off size={14} /> Deconnecter</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function TeamCalendlyCard() {
  const queryClient = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const { data: team } = useQuery<any[]>({ queryKey: ['calendly', 'team'], queryFn: () => api.get('/calendly/team').then((r) => r.data) })

  async function syncAll() {
    setSyncing(true)
    try {
      await api.post('/calendly/sync-all')
      queryClient.invalidateQueries({ queryKey: ['calendly', 'team'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-end border-b border-brand-100 p-3 dark:border-brand-800">
        <Button variant="secondary" onClick={syncAll} disabled={syncing}><RefreshCw size={14} /> {syncing ? 'Synchronisation...' : 'Tout synchroniser'}</Button>
      </div>
      <div className="divide-y divide-brand-100 dark:divide-brand-800">
        {team?.map((t) => (
          <div key={t.user.id} className="flex items-center justify-between p-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: t.user.avatarColor }}>
                {t.user.firstName[0]}{t.user.lastName[0]}
              </div>
              <span>{t.user.firstName} {t.user.lastName}</span>
            </div>
            {t.connected ? (
              <div className="text-right text-xs text-green-700">
                <p className="flex items-center justify-end gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {t.calendlyUserEmail}</p>
                {t.lastSyncAt && <p className="text-brand-400">Sync {formatDistanceToNow(new Date(t.lastSyncAt), { addSuffix: true, locale: fr })}</p>}
              </div>
            ) : (
              <span className="text-xs text-brand-300">Non connecte</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
