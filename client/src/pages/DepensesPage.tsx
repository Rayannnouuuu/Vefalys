import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { format } from 'date-fns'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea, Badge, EmptyState } from '../components/ui'
import { DEPENSE_CATEGORIES, labelFor } from '../lib/enums'
import { useAuthStore } from '../store/auth'
import type { Depense } from '../types'

export default function DepensesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Depense | null>(null)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const canDelete = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
  const { data: depenses } = useQuery<Depense[]>({ queryKey: ['depenses'], queryFn: () => api.get('/depenses').then((r) => r.data) })

  async function remove(id: string) {
    setError('')
    try {
      await api.delete(`/depenses/${id}`)
      queryClient.invalidateQueries({ queryKey: ['depenses'] })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  const total = depenses?.reduce((s, d) => s + d.amount, 0) || 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brand-900">Depenses</h1>
          <p className="text-sm text-brand-400">Total enregistre : {total.toLocaleString('fr-FR')} EUR</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Nouvelle depense</Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="p-0">
        {!depenses?.length && <EmptyState title="Aucune depense" description="Enregistrez vos depenses pour suivre votre tresorerie." />}
        {!!depenses?.length && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-400">
                <th className="px-4 py-3">Date</th>
                <th>Categorie</th>
                <th>Description</th>
                <th>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {depenses.map((d) => (
                <tr key={d.id} className="border-b border-brand-100 last:border-0 hover:bg-brand-50">
                  <td className="px-4 py-3">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  <td><Badge label={labelFor(DEPENSE_CATEGORIES, d.category)} /></td>
                  <td>{d.description || '-'}</td>
                  <td className="font-medium text-brand-900">{d.amount.toLocaleString('fr-FR')} EUR</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(d)} className="text-brand-300 hover:text-brand-600"><Pencil size={14} /></button>
                      {canDelete && (
                        <button onClick={() => remove(d.id)} className="text-brand-300 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateDepenseModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['depenses'] }); setShowCreate(false) }} />
      <EditDepenseModal depense={editing} onClose={() => setEditing(null)} onSaved={() => { queryClient.invalidateQueries({ queryKey: ['depenses'] }); setEditing(null) }} />
    </motion.div>
  )
}

function CreateDepenseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ category: 'FOURNITURES', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', accountingCode: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/depenses', { ...form, amount: Number(form.amount) })
      onCreated()
      setForm({ category: 'FOURNITURES', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', accountingCode: '' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle depense">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categorie</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {DEPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div><Label>Montant (EUR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
        </div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Code comptable (optionnel)</Label><Input value={form.accountingCode} onChange={(e) => setForm({ ...form, accountingCode: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function EditDepenseModal({ depense, onClose, onSaved }: { depense: Depense | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ category: '', amount: '', date: '', description: '', accountingCode: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (depense) {
      setForm({
        category: depense.category,
        amount: String(depense.amount),
        date: format(new Date(depense.date), 'yyyy-MM-dd'),
        description: depense.description || '',
        accountingCode: depense.accountingCode || '',
      })
    }
  }, [depense?.id])

  function handleClose() {
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!depense) return
    setError('')
    try {
      await api.patch(`/depenses/${depense.id}`, { ...form, amount: Number(form.amount) })
      setForm({ category: '', amount: '', date: '', description: '', accountingCode: '' })
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={!!depense} onClose={handleClose} title="Modifier la depense">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categorie</Label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {DEPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div><Label>Montant (EUR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
        </div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Code comptable (optionnel)</Label><Input value={form.accountingCode} onChange={(e) => setForm({ ...form, accountingCode: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer les modifications</Button>
      </form>
    </Modal>
  )
}
