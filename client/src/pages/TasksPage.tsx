import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, List, Columns3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea, Badge, EmptyState } from '../components/ui'
import { TASK_PRIORITIES, TASK_STATUSES, TASK_RECURRENCES, labelFor, colorFor } from '../lib/enums'
import type { Task } from '../types'

export default function TasksPage() {
  const [view, setView] = useState<'list' | 'kanban'>('kanban')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const queryClient = useQueryClient()
  const { data: tasks } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then((r) => r.data) })

  async function updateStatus(id: string, status: string) {
    await api.patch(`/tasks/${id}`, { status })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Taches</h1>
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}><List size={14} /></Button>
          <Button variant={view === 'kanban' ? 'primary' : 'secondary'} onClick={() => setView('kanban')}><Columns3 size={14} /></Button>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Nouvelle tache</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-4 gap-3">
          {TASK_STATUSES.map((status) => (
            <div key={status.value} className="rounded-xl border border-brand-100 bg-brand-50/40 p-2">
              <p className="mb-2 px-1 text-sm font-semibold text-brand-900">{status.label}</p>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {tasks?.filter((t) => t.status === status.value).map((t) => (
                    <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
                      <Card className="cursor-pointer p-3 transition-shadow hover:shadow-card" onClick={() => setEditing(t)}>
                        <p className="text-sm font-medium text-brand-900">{t.title}</p>
                        {t.dueDate && <p className="text-xs text-brand-400">{format(new Date(t.dueDate), 'dd/MM/yyyy')}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <Badge label={labelFor(TASK_PRIORITIES, t.priority)} color={colorFor(TASK_PRIORITIES, t.priority)} />
                          <Select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                            className="w-28 py-1 text-xs"
                          >
                            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </Select>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-0">
          {!tasks?.length && <EmptyState title="Aucune tache" />}
          {tasks?.map((t) => (
            <div key={t.id} onClick={() => setEditing(t)} className="flex cursor-pointer items-center justify-between border-b border-brand-100 p-3 last:border-0 hover:bg-brand-50">
              <div>
                <p className="text-sm font-medium text-brand-900">{t.title}</p>
                <p className="text-xs text-brand-400">{t.dueDate ? format(new Date(t.dueDate), 'dd/MM/yyyy') : 'Sans date'} {t.contact ? `- ${t.contact.firstName} ${t.contact.lastName}` : ''}</p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Badge label={labelFor(TASK_PRIORITIES, t.priority)} color={colorFor(TASK_PRIORITIES, t.priority)} />
                <Select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="w-32">
                  {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </div>
            </div>
          ))}
        </Card>
      )}

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { invalidate(); setShowCreate(false) }} />
      <EditTaskModal task={editing} onClose={() => setEditing(null)} onSaved={() => { invalidate(); setEditing(null) }} />
    </motion.div>
  )
}

function CreateTaskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'MOYENNE', recurrence: 'NONE' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/tasks', { ...form, dueDate: form.dueDate || undefined })
      onCreated()
      setForm({ title: '', description: '', dueDate: '', priority: 'MOYENNE', recurrence: 'NONE' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle tache">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Echeance</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div>
            <Label>Priorite</Label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Recurrence</Label>
            <Select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
              {TASK_RECURRENCES.map((r) => <option key={r} value={r}>{r === 'NONE' ? 'Aucune' : r === 'WEEKLY' ? 'Hebdomadaire' : 'Mensuelle'}</option>)}
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Creer</Button>
      </form>
    </Modal>
  )
}

function EditTaskModal({ task, onClose, onSaved }: { task: Task | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'MOYENNE', recurrence: 'NONE' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        priority: task.priority,
        recurrence: task.recurrence,
      })
    }
  }, [task?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task) return
    setError('')
    try {
      await api.patch(`/tasks/${task.id}`, { ...form, dueDate: form.dueDate || undefined })
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function handleDelete() {
    if (!task || !window.confirm('Supprimer cette tache ?')) return
    await api.delete(`/tasks/${task.id}`)
    onSaved()
  }

  return (
    <Modal open={!!task} onClose={onClose} title="Modifier la tache">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Echeance</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div>
            <Label>Priorite</Label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Recurrence</Label>
            <Select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
              {TASK_RECURRENCES.map((r) => <option key={r} value={r}>{r === 'NONE' ? 'Aucune' : r === 'WEEKLY' ? 'Hebdomadaire' : 'Mensuelle'}</option>)}
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Enregistrer</Button>
          <Button type="button" variant="danger" onClick={handleDelete}><Trash2 size={14} /></Button>
        </div>
      </form>
    </Modal>
  )
}
