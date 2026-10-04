import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Plus, Trash2, CalendarCheck2, Link2Off, RefreshCw, Pencil, KeyRound } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea, Badge } from '../components/ui'
import { useAuthStore } from '../store/auth'
import type { Tag, User } from '../types'

export default function SettingsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

  const { data: users } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data) })
  const { data: tags } = useQuery<Tag[]>({ queryKey: ['tags'], queryFn: () => api.get('/tags').then((r) => r.data) })
  const { data: templates } = useQuery({ queryKey: ['relance-templates'], queryFn: () => api.get('/relances/templates/all').then((r) => r.data) })

  const isAdmin = currentUser?.role === 'ADMIN'

  async function toggleActive(user: User) {
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  async function removeTag(id: string) {
    await api.delete(`/tags/${id}`)
    queryClient.invalidateQueries({ queryKey: ['tags'] })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <h1 className="font-serif text-2xl font-medium text-brand-900">Parametres</h1>

      <CalendlySection />

      <MyAccountSection />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-500">Equipe</h2>
          {isAdmin && <Button variant="secondary" onClick={() => setShowInvite(true)}><Plus size={14} /> Ajouter un utilisateur</Button>}
        </div>
        <div className="space-y-2">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded border border-brand-100 p-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <span>{u.firstName} {u.lastName}</span>
                <span className="text-brand-400">{u.email}</span>
                {u.isActive === false && <Badge label="Desactive" color="#dc2626" />}
              </div>
              <div className="flex items-center gap-2">
                <Badge label={u.role} />
                {isAdmin && (
                  <>
                    <button onClick={() => setEditingUser(u)} title="Modifier" className="text-brand-300 hover:text-brand-600"><Pencil size={14} /></button>
                    <button onClick={() => setResetPasswordUser(u)} title="Reinitialiser le mot de passe" className="text-brand-300 hover:text-brand-600"><KeyRound size={14} /></button>
                  </>
                )}
                {isAdmin && u.id !== currentUser?.id && (
                  <Button variant="ghost" onClick={() => toggleActive(u)}>{u.isActive === false ? 'Reactiver' : 'Desactiver'}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-500">Tags</h2>
          <Button variant="secondary" onClick={() => setShowTag(true)}><Plus size={14} /> Nouveau tag</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags?.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <Badge label={t.name} color={t.color} />
              <button onClick={() => removeTag(t.id)} className="text-brand-300 hover:text-red-600"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-500">Modeles de relance</h2>
          <Button variant="secondary" onClick={() => setShowTemplate(true)}><Plus size={14} /> Nouveau modele</Button>
        </div>
        <div className="space-y-2">
          {templates?.map((t: any) => (
            <div key={t.id} className="rounded border border-brand-100 p-2 text-sm">
              <p className="font-medium">{t.name} <Badge label={t.channel} /></p>
              {t.subject && <p className="text-xs text-brand-400">Sujet : {t.subject}</p>}
              <p className="mt-1 whitespace-pre-wrap text-xs text-brand-500">{t.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowInvite(false) }} />
      <CreateTagModal open={showTag} onClose={() => setShowTag(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['tags'] }); setShowTag(false) }} />
      <CreateTemplateModal open={showTemplate} onClose={() => setShowTemplate(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['relance-templates'] }); setShowTemplate(false) }} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditingUser(null) }} />
      <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} onDone={() => setResetPasswordUser(null)} />
    </motion.div>
  )
}

function MyAccountSection() {
  const currentUser = useAuthStore((s) => s.user)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/users/me/change-password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setSuccess('Mot de passe mis a jour.')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-brand-500">Mon compte</h2>
      <p className="mb-3 text-sm text-brand-400">{currentUser?.firstName} {currentUser?.lastName} - {currentUser?.email}</p>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 items-end gap-3">
        <div><Label>Mot de passe actuel</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
        <div><Label>Nouveau mot de passe</Label><Input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
        <Button type="submit">Changer le mot de passe</Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
    </Card>
  )
}

function EditUserModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'COLLABORATEUR' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role })
  }, [user?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    try {
      await api.patch(`/users/${user.id}`, form)
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title="Modifier l'utilisateur">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Prenom</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div><Label>Nom</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
        </div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="COLLABORATEUR">Collaborateur</option>
          </Select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose, onDone }: { user: User | null; onClose: () => void; onDone: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    try {
      await api.post(`/users/${user.id}/reset-password`, { newPassword })
      setNewPassword('')
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Reinitialiser le mot de passe de ${user?.firstName || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-brand-400">Definissez un nouveau mot de passe provisoire. Communiquez-le a la personne concernee par un canal securise.</p>
        <div><Label>Nouveau mot de passe</Label><Input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Reinitialiser</Button>
      </form>
    </Modal>
  )
}

function CalendlySection() {
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
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-500"><CalendarCheck2 size={15} /> Calendly</h2>
      {!status?.connected && (
        <>
          <p className="mb-3 text-sm text-brand-400">
            Connectez votre compte Calendly pour que les rendez-vous pris en ligne remontent automatiquement dans l'Agenda.
            Recuperez votre jeton d'acces personnel depuis Calendly (Integrations &gt; API &amp; Webhooks &gt; Your personal access tokens),
            puis collez-le ici. Le jeton reste stocke uniquement sur votre serveur.
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

function InviteUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'COLLABORATEUR' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/users', form)
      onCreated()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un utilisateur">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Prenom</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div><Label>Nom</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
        </div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><Label>Mot de passe provisoire</Label><Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="COLLABORATEUR">Collaborateur</option>
          </Select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Ajouter</Button>
      </form>
    </Modal>
  )
}

function CreateTagModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#397a52')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/tags', { name, color })
      onCreated()
      setName('')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau tag">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><Label>Couleur</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20 p-1" /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Creer</Button>
      </form>
    </Modal>
  )
}

function CreateTemplateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', channel: 'EMAIL', subject: '', body: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/relances/templates', form)
      onCreated()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau modele de relance">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>
          <Label>Canal</Label>
          <Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </Select>
        </div>
        {form.channel === 'EMAIL' && <div><Label>Sujet</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>}
        <div><Label>Corps du message</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Creer</Button>
      </form>
    </Modal>
  )
}
