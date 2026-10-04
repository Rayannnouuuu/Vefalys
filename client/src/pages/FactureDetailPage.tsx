import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, Paperclip, Upload, Pencil, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Badge, Modal, Label, Input, Select } from '../components/ui'
import { FACTURE_STATUSES, PAIEMENT_METHODS, labelFor, colorFor } from '../lib/enums'
import { useAuthStore } from '../store/auth'
import type { Facture } from '../types'

export default function FactureDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const canDelete = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
  const [showPayment, setShowPayment] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [error, setError] = useState('')

  const { data: facture, isLoading } = useQuery<Facture>({ queryKey: ['facture', id], queryFn: () => api.get(`/factures/${id}`).then((r) => r.data) })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['facture', id] })
    queryClient.invalidateQueries({ queryKey: ['factures'] })
  }

  async function updateStatus(status: string) {
    await api.patch(`/factures/${id}`, { status })
    invalidate()
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer cette facture ? Action irreversible.')) return
    await api.delete(`/factures/${id}`)
    queryClient.invalidateQueries({ queryKey: ['factures'] })
    navigate('/factures')
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: uploaded } = await api.post('/uploads/raw', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.patch(`/factures/${id}`, { attachmentPath: uploaded.path, status: facture?.status === 'BROUILLON' ? 'ENVOYEE' : undefined })
      invalidate()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  if (isLoading || !facture) return <p className="text-sm text-brand-400">Chargement...</p>

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <button onClick={() => navigate('/factures')} className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-700">
        <ArrowLeft size={14} /> Retour aux factures
      </button>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-400">Promoteur</p>
          <h1 className="font-serif text-2xl font-medium text-brand-900">{facture.promoterName || 'Non renseigne'}</h1>
          <p className="mt-1 text-sm text-brand-500">
            Client : {facture.contact?.firstName} {facture.contact?.lastName} {'·'} Ref. {facture.reference || facture.number}{facture.isAvoir ? ' (avoir)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={labelFor(FACTURE_STATUSES, facture.status)} color={colorFor(FACTURE_STATUSES, facture.status)} />
          <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={14} /> Modifier</Button>
          {!facture.isAvoir && facture.remaining > 0 && <Button onClick={() => setShowPayment(true)}><Plus size={14} /> Paiement</Button>}
          {canDelete && <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /></Button>}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Statut</Label>
            <Select value={facture.status} onChange={(e) => updateStatus(e.target.value)}>
              {FACTURE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Document de la facture</Label>
            {facture.attachmentPath ? (
              <a href={facture.attachmentPath} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">
                <Paperclip size={14} /> Voir le fichier importe
              </a>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm text-brand-500 hover:bg-brand-50">
                <Upload size={14} /> Importer la facture generee
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex justify-between text-sm">
          <span className="text-brand-400">Montant TTC</span>
          <span className="font-semibold text-brand-900">{facture.totalTTC.toLocaleString('fr-FR')} EUR</span>
        </div>
        {facture.items.map((it) => (
          <p key={it.id} className="text-sm text-brand-500">{it.description}</p>
        ))}
        <div className="mt-4 flex justify-end gap-6 text-sm">
          <span className="text-green-600">Paye : {facture.paid.toLocaleString('fr-FR')} EUR</span>
          <span className="text-red-600">Reste : {facture.remaining.toLocaleString('fr-FR')} EUR</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-brand-500">Paiements recus</h2>
        {!facture.paiements.length && <p className="text-sm text-brand-400">Aucun paiement enregistre.</p>}
        <div className="space-y-2">
          {facture.paiements.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border border-brand-100 p-2 text-sm">
              <span>{labelFor(PAIEMENT_METHODS, p.method)}</span>
              <span>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
              <span className="font-medium">{p.amount.toLocaleString('fr-FR')} EUR</span>
            </div>
          ))}
        </div>
      </Card>

      <RecordPaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        factureId={id!}
        maxAmount={facture.remaining}
        onDone={() => { invalidate(); setShowPayment(false) }}
      />
      <EditFactureModal open={showEdit} onClose={() => setShowEdit(false)} facture={facture} onDone={() => { invalidate(); setShowEdit(false) }} />
    </motion.div>
  )
}

function EditFactureModal({ open, onClose, facture, onDone }: { open: boolean; onClose: () => void; facture: Facture; onDone: () => void }) {
  const [promoterName, setPromoterName] = useState(facture.promoterName || '')
  const [reference, setReference] = useState(facture.reference || '')
  const [description, setDescription] = useState(facture.items[0]?.description || '')
  const [amount, setAmount] = useState(String(facture.items[0]?.unitPrice ?? facture.totalTTC))
  const [dueDate, setDueDate] = useState(facture.dueDate ? facture.dueDate.slice(0, 10) : '')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.patch(`/factures/${facture.id}`, {
        promoterName,
        reference: reference || undefined,
        dueDate: dueDate || undefined,
        items: [{ description: description || 'Facture', quantity: 1, unitPrice: Number(amount), vatRate: 0 }],
      })
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier la facture">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Promoteur</Label><Input value={promoterName} onChange={(e) => setPromoterName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <div><Label>Date d'echeance</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label>Montant TTC (EUR)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function RecordPaymentModal({ open, onClose, factureId, maxAmount, onDone }: { open: boolean; onClose: () => void; factureId: string; maxAmount: number; onDone: () => void }) {
  const [amount, setAmount] = useState(String(maxAmount))
  const [method, setMethod] = useState('VIREMENT')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/factures/${factureId}/paiements`, { amount: Number(amount), method })
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enregistrer un paiement">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Montant (EUR)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
        <div>
          <Label>Mode de paiement</Label>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAIEMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}
