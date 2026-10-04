import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Paperclip } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Badge, EmptyState } from '../components/ui'
import { FACTURE_STATUSES, labelFor, colorFor } from '../lib/enums'
import type { Contact, Facture } from '../types'

export default function FacturesListPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: factures } = useQuery<Facture[]>({
    queryKey: ['factures', statusFilter],
    queryFn: () => api.get('/factures', { params: { status: statusFilter || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Factures</h1>
          <p className="text-sm text-brand-400">Suivi des factures promoteurs - importez le document une fois genere par vos soins.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Ajouter une facture</Button>
      </div>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="">Tous les statuts</option>
        {FACTURE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </Select>

      <Card className="p-0">
        {!factures?.length && <EmptyState title="Aucune facture" description="Ajoutez une facture pour suivre si elle est en attente ou payee." />}
        {!!factures?.length && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-400">
                <th className="px-4 py-3">Promoteur</th>
                <th>Client / programme</th>
                <th>Reference</th>
                <th>Echeance</th>
                <th>Montant</th>
                <th>Reste du</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {factures.map((f, i) => (
                <motion.tr
                  key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
                  onClick={() => navigate(`/factures/${f.id}`)}
                  className="cursor-pointer border-b border-brand-100 last:border-0 hover:bg-brand-50"
                >
                  <td className="px-4 py-3 font-medium text-brand-900">{f.promoterName || <span className="text-brand-300">Non renseigne</span>}</td>
                  <td className="text-brand-500">{f.contact?.firstName} {f.contact?.lastName}</td>
                  <td>{f.reference || f.number}{f.isAvoir ? ' (avoir)' : ''}</td>
                  <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{f.totalTTC.toLocaleString('fr-FR')} EUR</td>
                  <td>{f.remaining.toLocaleString('fr-FR')} EUR</td>
                  <td><Badge label={labelFor(FACTURE_STATUSES, f.status)} color={colorFor(FACTURE_STATUSES, f.status)} /></td>
                  <td>{f.attachmentPath && <Paperclip size={14} className="text-brand-400" />}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateFactureModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={(id) => { queryClient.invalidateQueries({ queryKey: ['factures'] }); setShowCreate(false); navigate(`/factures/${id}`) }} />
    </div>
  )
}

function CreateFactureModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [promoterName, setPromoterName] = useState('')
  const [contactId, setContactId] = useState('')
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const { data: contacts } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: () => api.get('/contacts').then((r) => r.data), enabled: open })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      let attachmentPath: string | undefined
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const { data: uploaded } = await api.post('/uploads/raw', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        attachmentPath = uploaded.path
      }
      const { data } = await api.post('/factures', {
        promoterName,
        contactId,
        reference: reference || undefined,
        dueDate: dueDate || undefined,
        attachmentPath,
        items: [{ description: reference || 'Facture', quantity: 1, unitPrice: Number(amount), vatRate: 0 }],
      })
      onCreated(data.id)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une facture">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Promoteur a facturer</Label>
          <Input value={promoterName} onChange={(e) => setPromoterName(e.target.value)} placeholder="Ex: Urbanys Promotion" required />
        </div>
        <div>
          <Label>Client / prospect concerne</Label>
          <Select value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            <option value="">Selectionner...</option>
            {contacts?.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Reference de la facture</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex: FAC-PROMOTEUR-0042" /></div>
          <div><Label>Montant TTC (EUR)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
        </div>
        <div><Label>Date d'echeance</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        <div>
          <Label>Importer le fichier (optionnel)</Label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Ajouter la facture</Button>
      </form>
    </Modal>
  )
}
