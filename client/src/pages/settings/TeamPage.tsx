import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Pencil, KeyRound, UserCheck, UserX, Mail, Clock, Trash2, AlertTriangle } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, Button, Modal, Label, Input, Select, Badge, Textarea } from '../../components/ui'
import { useAuthStore } from '../../store/auth'
import type { User } from '../../types'
import { SettingsSection } from './SettingsLayout'

export default function TeamPage() {
  const currentUser = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [rejecting, setRejecting] = useState<User | null>(null)
  const [error, setError] = useState('')

  const { data: users } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data) })
  const { data: pending } = useQuery<User[]>({ queryKey: ['users', 'pending'], queryFn: () => api.get('/users/pending').then((r) => r.data) })

  const isAdmin = currentUser?.role === 'ADMIN'
  const isManager = isAdmin || currentUser?.role === 'MANAGER'
  const activeTeam = users?.filter((u) => u.approvalStatus !== 'PENDING') || []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['users', 'pending'] })
    queryClient.invalidateQueries({ queryKey: ['audit'] })
  }

  async function toggleActive(user: User) {
    setError('')
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      invalidate()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function approve(id: string) {
    await api.post(`/users/${id}/approve`)
    invalidate()
  }

  return (
    <>
      {isManager && !!pending?.length && (
        <SettingsSection>
          <Card className="border-accent-200 bg-accent-50">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-700"><UserCheck size={15} /> Comptes en attente de validation ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-accent-200 bg-white p-3 text-sm">
                  <div>
                    <p className="font-medium text-brand-800">{u.firstName} {u.lastName} <span className="font-normal text-brand-400">{u.email}</span></p>
                    <p className="flex items-center gap-1 text-xs text-brand-400">
                      {u.emailVerified ? <><Mail size={11} /> Email confirme</> : <><Clock size={11} /> Email non confirme</>}
                      {u.createdAt && ` - inscrit ${formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: fr })}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approve(u.id)}><UserCheck size={14} /> Valider</Button>
                    <Button variant="danger" onClick={() => setRejecting(u)}><UserX size={14} /> Refuser</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </SettingsSection>
      )}

      <SettingsSection
        title="Equipe"
        description="Roles, activation et acces de chaque membre. Un compte desactive conserve son historique ; un compte supprime est definitivement efface du roster."
      >
        {isManager && (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowInvite(true)}><Plus size={14} /> Ajouter un utilisateur</Button>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Card className="divide-y divide-brand-100 p-0 dark:divide-brand-800">
          {activeTeam.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: u.avatarColor }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-brand-900 dark:text-white">
                    {u.firstName} {u.lastName}
                    {u.id === currentUser?.id && <span className="ml-1.5 text-xs font-normal text-brand-400">(vous)</span>}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-brand-400">
                    {u.email}
                    {u.isActive === false && <Badge label="Desactive" color="#dc2626" />}
                    {u.approvalStatus === 'REJECTED' && <Badge label="Refuse" color="#dc2626" />}
                    {u.emailVerified === false && <Badge label="Email non confirme" color="#d97706" />}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={u.role} />
                {isAdmin && (
                  <>
                    <button onClick={() => setEditingUser(u)} title="Modifier" className="text-brand-300 hover:text-brand-600"><Pencil size={14} /></button>
                    <button onClick={() => setResetPasswordUser(u)} title="Reinitialiser le mot de passe" className="text-brand-300 hover:text-brand-600"><KeyRound size={14} /></button>
                  </>
                )}
                {isAdmin && u.id !== currentUser?.id && (
                  <>
                    <Button variant="ghost" onClick={() => toggleActive(u)}>{u.isActive === false ? 'Reactiver' : 'Desactiver'}</Button>
                    <button onClick={() => setDeletingUser(u)} title="Supprimer definitivement" className="text-brand-300 hover:text-red-600"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </Card>
      </SettingsSection>

      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} onCreated={() => { invalidate(); setShowInvite(false) }} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { invalidate(); setEditingUser(null) }} />
      <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} onDone={() => setResetPasswordUser(null)} />
      <DeleteUserModal user={deletingUser} onClose={() => setDeletingUser(null)} onDone={() => { invalidate(); setDeletingUser(null) }} />
      <RejectUserModal user={rejecting} onClose={() => setRejecting(null)} onDone={() => { invalidate(); setRejecting(null) }} />
    </>
  )
}

function RejectUserModal({ user, onClose, onDone }: { user: User | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    await api.post(`/users/${user.id}/reject`, { reason: reason || undefined })
    setReason('')
    onDone()
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Refuser le compte de ${user?.firstName || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Motif (optionnel, envoye par email)</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <Button type="submit" variant="danger" className="w-full">Refuser le compte</Button>
      </form>
    </Modal>
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

function DeleteUserModal({ user, onClose, onDone }: { user: User | null; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await api.delete(`/users/${user.id}`)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Supprimer ${user?.firstName || ''} ${user?.lastName || ''}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            Suppression definitive et irreversible du compte. Les contacts, factures, taches et autres donnees qu'il a crees sont
            <strong> conserves</strong> mais ne lui seront plus attribues. Preferez "Desactiver" si vous souhaitez seulement couper l'acces.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={loading}>
            {loading ? 'Suppression...' : 'Supprimer definitivement'}
          </Button>
        </div>
      </div>
    </Modal>
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
        <p className="text-xs text-brand-400">Un compte cree ici par un administrateur est directement actif, sans etape de confirmation email ni validation.</p>
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
