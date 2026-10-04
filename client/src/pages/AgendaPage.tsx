import { useMemo, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, CalendarCheck2, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea } from '../components/ui'
import { APPOINTMENT_TYPES, labelFor } from '../lib/enums'
import type { Appointment, Contact } from '../types'

export default function AgendaPage() {
  const [month, setMonth] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [syncing, setSyncing] = useState(false)
  const queryClient = useQueryClient()

  const rangeStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd])

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['appointments', rangeStart.toISOString()],
    queryFn: () => api.get('/appointments', { params: { from: rangeStart.toISOString(), to: rangeEnd.toISOString() } }).then((r) => r.data),
  })
  const { data: calendlyStatus } = useQuery({ queryKey: ['calendly', 'status'], queryFn: () => api.get('/calendly/status').then((r) => r.data) })

  function appointmentsForDay(day: Date) {
    return appointments?.filter((a) => isSameDay(new Date(a.startAt), day)) || []
  }

  async function syncCalendly() {
    setSyncing(true)
    try {
      await api.post('/calendly/sync')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-brand-900">Agenda</h1>
        <div className="flex items-center gap-2">
          {calendlyStatus?.connected && (
            <Button variant="secondary" onClick={syncCalendly} disabled={syncing}>
              <RefreshCw size={14} /> {syncing ? 'Synchronisation...' : 'Synchroniser Calendly'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft size={16} /></Button>
          <span className="w-36 text-center text-sm font-medium capitalize">{format(month, 'MMMM yyyy', { locale: fr })}</span>
          <Button variant="ghost" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={16} /></Button>
          <Button onClick={() => { setSelectedDay(new Date()); setShowCreate(true) }}><Plus size={14} /> Rendez-vous</Button>
        </div>
      </div>

      <Card className="p-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-brand-400">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const items = appointmentsForDay(day)
            return (
              <div
                key={day.toISOString()}
                onClick={() => { setSelectedDay(day); setShowCreate(true) }}
                className={`min-h-[90px] cursor-pointer rounded-lg border border-brand-100 p-1.5 text-left hover:bg-brand-50 ${!isSameMonth(day, month) ? 'opacity-40' : ''} ${isSameDay(day, new Date()) ? 'border-brand-500' : ''}`}
              >
                <p className="text-xs font-medium">{format(day, 'd')}</p>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((a) => (
                    <p
                      key={a.id}
                      onClick={(e) => { e.stopPropagation(); setEditing(a) }}
                      className="flex items-center gap-1 truncate rounded bg-brand-50 px-1 text-[10px] text-brand-700 hover:bg-brand-100"
                    >
                      {a.source === 'CALENDLY' && <CalendarCheck2 size={9} className="shrink-0" />}
                      {format(new Date(a.startAt), 'HH:mm')} {a.title}
                    </p>
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-brand-400">+{items.length - 3} autres</p>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <CreateAppointmentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultDate={selectedDay || new Date()}
        onCreated={() => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setShowCreate(false) }}
      />
      <EditAppointmentModal
        appointment={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setEditing(null) }}
      />
    </motion.div>
  )
}

function CreateAppointmentModal({ open, onClose, defaultDate, onCreated }: { open: boolean; onClose: () => void; defaultDate: Date; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    type: 'RDV_PHYSIQUE',
    date: format(defaultDate, 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    contactId: '',
    description: '',
  })
  const [error, setError] = useState('')
  const { data: contacts } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: () => api.get('/contacts').then((r) => r.data), enabled: open })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/appointments', {
        title: form.title,
        type: form.type,
        startAt: new Date(`${form.date}T${form.startTime}`),
        endAt: new Date(`${form.date}T${form.endTime}`),
        location: form.location,
        contactId: form.contactId || undefined,
        description: form.description,
      })
      onCreated()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau rendez-vous">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {APPOINTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Contact</Label>
            <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
              <option value="">Aucun</option>
              {contacts?.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Debut</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          <div><Label>Fin</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
        </div>
        <div><Label>Lieu</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">{labelFor(APPOINTMENT_TYPES, form.type)} : creer</Button>
      </form>
    </Modal>
  )
}

function EditAppointmentModal({ appointment, onClose, onSaved }: { appointment: Appointment | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', type: 'RDV_PHYSIQUE', date: '', startTime: '', endTime: '', location: '', contactId: '', description: '' })
  const [error, setError] = useState('')
  const { data: contacts } = useQuery<Contact[]>({ queryKey: ['contacts'], queryFn: () => api.get('/contacts').then((r) => r.data), enabled: !!appointment })

  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.startAt)
      const end = new Date(appointment.endAt)
      setForm({
        title: appointment.title,
        type: appointment.type,
        date: format(start, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        location: appointment.location || '',
        contactId: appointment.contactId || '',
        description: appointment.description || '',
      })
    }
  }, [appointment?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appointment) return
    setError('')
    try {
      await api.patch(`/appointments/${appointment.id}`, {
        title: form.title,
        type: form.type,
        startAt: new Date(`${form.date}T${form.startTime}`),
        endAt: new Date(`${form.date}T${form.endTime}`),
        location: form.location,
        contactId: form.contactId || undefined,
        description: form.description,
      })
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function handleDelete() {
    if (!appointment || !window.confirm('Supprimer ce rendez-vous ?')) return
    await api.delete(`/appointments/${appointment.id}`)
    onSaved()
  }

  return (
    <Modal open={!!appointment} onClose={onClose} title="Modifier le rendez-vous">
      <form onSubmit={handleSubmit} className="space-y-3">
        {appointment?.source === 'CALENDLY' && (
          <p className="flex items-center gap-1.5 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-xs text-accent-700">
            <CalendarCheck2 size={13} /> Ce rendez-vous provient de Calendly. Les modifications restent locales et ne sont pas renvoyees vers Calendly.
          </p>
        )}
        <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {APPOINTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Contact</Label>
            <Select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
              <option value="">Aucun</option>
              {contacts?.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Debut</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          <div><Label>Fin</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
        </div>
        <div><Label>Lieu</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Enregistrer</Button>
          <Button type="button" variant="danger" onClick={handleDelete}><Trash2 size={14} /></Button>
        </div>
      </form>
    </Modal>
  )
}
