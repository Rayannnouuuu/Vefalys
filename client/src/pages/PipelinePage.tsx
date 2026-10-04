import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'motion/react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea, Badge } from '../components/ui'
import { OPPORTUNITY_STAGES, labelFor } from '../lib/enums'
import { useCan } from '../lib/permissions'
import type { Contact, Opportunity } from '../types'

export default function PipelinePage() {
  const [showCreate, setShowCreate] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => api.get('/opportunities').then((r) => r.data),
  })
  const { data: stats } = useQuery({ queryKey: ['opportunities', 'stats'], queryFn: () => api.get('/opportunities/stats').then((r) => r.data) })

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const stage = over.id as string
    const opp = opportunities?.find((o) => o.id === active.id)
    if (!opp || opp.stage === stage) return
    await api.patch(`/opportunities/${opp.id}/stage`, { stage })
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] })
  }

  const totalPipeline = opportunities?.filter((o) => !['FERME_GAGNE', 'FERME_PERDU'].includes(o.stage)).reduce((s, o) => s + o.amount, 0) || 0

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-900">Pipeline VEFA</h1>
          <p className="text-sm text-brand-400">
            Pipeline total : {totalPipeline.toLocaleString('fr-FR')} EUR
            {stats && <span> - Taux de conversion : {stats.conversionRate}%</span>}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Nouvelle opportunite</Button>
      </div>

      <DndContext onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
          {OPPORTUNITY_STAGES.map((stage, i) => {
            const items = opportunities?.filter((o) => o.stage === stage.value) || []
            const total = items.reduce((s, o) => s + o.amount, 0)
            return (
              <Column key={stage.value} id={stage.value} label={stage.label} count={items.length} total={total} index={i}>
                {items.map((opp) => (
                  <DraggableCard key={opp.id} opp={opp} onClick={() => setSelectedId(opp.id)} />
                ))}
              </Column>
            )
          })}
        </div>
        <DragOverlay>
          {activeId ? <OppCard opp={opportunities?.find((o) => o.id === activeId)!} /> : null}
        </DragOverlay>
      </DndContext>

      <CreateOpportunityModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['opportunities'] })
          setShowCreate(false)
        }}
      />
      <OpportunityDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function OpportunityDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const canDelete = useCan('COLLAB_DELETE_OPPORTUNITIES')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', probability: '', description: '' })
  const [error, setError] = useState('')

  const { data: opp } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => api.get(`/opportunities/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  useEffect(() => {
    if (opp) setForm({ title: opp.title, amount: String(opp.amount), probability: String(opp.probability), description: opp.description || '' })
    setEditing(false)
  }, [opp?.id])

  function handleClose() {
    setEditing(false)
    onClose()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.patch(`/opportunities/${id}`, { title: form.title, amount: Number(form.amount), probability: Number(form.probability), description: form.description })
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      setEditing(false)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer cette opportunite ? Action irreversible.')) return
    await api.delete(`/opportunities/${id}`)
    queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    handleClose()
  }

  return (
    <Modal open={!!id} onClose={handleClose} title={opp?.title || ''} wide>
      {!opp ? (
        <p className="text-sm text-brand-400">Chargement...</p>
      ) : editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Montant estime (EUR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><Label>Probabilite (%)</Label><Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Annuler</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={14} /> Modifier</Button>
            {canDelete && <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /> Supprimer</Button>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-brand-400">Contact : </span>{opp.contact?.firstName} {opp.contact?.lastName}</div>
            <div><span className="text-brand-400">Montant : </span>{opp.amount.toLocaleString('fr-FR')} EUR</div>
            <div><span className="text-brand-400">Probabilite : </span>{opp.probability}%</div>
          </div>
          {opp.description && <p className="text-sm text-brand-600">{opp.description}</p>}
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-500">Historique des etapes</p>
            <div className="space-y-1">
              {opp.history?.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded border border-brand-100 p-2 text-xs">
                  <span>{h.fromStage ? `${labelFor(OPPORTUNITY_STAGES, h.fromStage)} -> ` : ''}{labelFor(OPPORTUNITY_STAGES, h.toStage)}</span>
                  <span className="text-brand-400">{format(new Date(h.changedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              ))}
            </div>
          </div>
          {!!opp.relances?.length && (
            <div>
              <p className="mb-2 text-sm font-semibold text-brand-500">Relances liees</p>
              <div className="flex flex-wrap gap-2">
                {opp.relances.map((r: any) => <Badge key={r.id} label={`${r.type} - ${format(new Date(r.dueDate), 'dd/MM')}`} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function Column({ id, label, count, total, index, children }: { id: string; label: string; count: number; total: number; index: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`flex w-64 shrink-0 flex-col rounded-xl border p-2 transition-colors ${isOver ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-brand-50/40'}`}
    >
      <div className="mb-2 px-2">
        <p className="text-sm font-semibold text-brand-900">{label}</p>
        <p className="text-xs text-brand-400">{count} - {total.toLocaleString('fr-FR')} EUR</p>
      </div>
      <div className="flex-1 space-y-2">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </div>
    </motion.div>
  )
}

function DraggableCard({ opp, onClick }: { opp: Opportunity; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 } : undefined
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
    >
      <OppCard opp={opp} />
    </motion.div>
  )
}

function OppCard({ opp }: { opp: Opportunity }) {
  if (!opp) return null
  return (
    <Card className="cursor-grab p-3 transition-shadow hover:shadow-card active:cursor-grabbing">
      <p className="text-sm font-medium text-brand-900">{opp.title}</p>
      <p className="text-xs text-brand-400">{opp.contact?.firstName} {opp.contact?.lastName}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-700">{opp.amount.toLocaleString('fr-FR')} EUR</span>
        <span className="text-brand-400">{opp.probability}%</span>
      </div>
    </Card>
  )
}

function CreateOpportunityModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', contactId: '', amount: '', probability: '50', description: '' })
  const [error, setError] = useState('')
  const { data: contacts } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: () => api.get('/contacts').then((r) => r.data), enabled: open })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/opportunities', { ...form, amount: Number(form.amount), probability: Number(form.probability) })
      onCreated()
      setForm({ title: '', contactId: '', amount: '', probability: '50', description: '' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle opportunite">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div>
          <Label>Contact</Label>
          <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} required>
            <option value="">Selectionner...</option>
            {contacts?.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Montant estime (EUR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
          <div><Label>Probabilite (%)</Label><Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Creer</Button>
      </form>
    </Modal>
  )
}
