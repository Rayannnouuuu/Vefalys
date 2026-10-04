import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Upload, Copy } from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Card, Input, Select, Modal, Label, Badge, EmptyState } from '../components/ui'
import { CONTACT_STATUSES, CONTACT_SOURCES, labelFor, colorFor } from '../lib/enums'
import type { Contact } from '../types'

export default function ContactsListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts', search, status],
    queryFn: () => api.get('/contacts', { params: { search: search || undefined, status: status || undefined } }).then((r) => r.data),
  })

  async function duplicate(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const { data } = await api.post(`/contacts/${id}/duplicate`)
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    navigate(`/contacts/${data.id}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-brand-900">Contacts</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Importer
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouveau contact
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">Tous les statuts</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>

      <Card className="p-0">
        {isLoading && <p className="p-6 text-sm text-brand-400">Chargement...</p>}
        {!isLoading && !contacts?.length && <EmptyState title="Aucun contact" description="Creez votre premier contact pour commencer." />}
        {!!contacts?.length && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-400">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Proprietaire</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.02 }}
                  onClick={() => navigate(`/contacts/${c.id}`)}
                  className="cursor-pointer border-b border-brand-100 last:border-0 hover:bg-brand-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-900">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-brand-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">{c.company || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge label={labelFor(CONTACT_STATUSES, c.status)} color={colorFor(CONTACT_STATUSES, c.status)} />
                  </td>
                  <td className="px-4 py-3 text-brand-500">{labelFor(CONTACT_SOURCES, c.source)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((t) => <Badge key={t.tag.id} label={t.tag.name} color={t.tag.color} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-500">{c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => duplicate(e, c.id)} title="Dupliquer" className="text-brand-300 hover:text-brand-600">
                      <Copy size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateContactModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
          setShowCreate(false)
        }}
      />
      <ImportContactsModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
          setShowImport(false)
        }}
      />
    </motion.div>
  )
}

function CreateContactModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', sector: '', location: '', status: 'PROSPECT_FROID', source: 'DIRECT' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/contacts', form)
      onCreated()
      setForm({ firstName: '', lastName: '', email: '', phone: '', company: '', sector: '', location: '', status: 'PROSPECT_FROID', source: 'DIRECT' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau contact">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Prenom</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div><Label>Nom</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Telephone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Entreprise</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label>Localisation</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Statut</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {CONTACT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Creer le contact</Button>
      </form>
    </Modal>
  )
}

function ImportContactsModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [csvText, setCsvText] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  async function handleImport() {
    setError('')
    setResult('')
    try {
      const lines = csvText.trim().split('\n').filter(Boolean)
      const [header, ...rows] = lines
      const cols = header.split(',').map((c) => c.trim().toLowerCase())
      const contacts = rows.map((row) => {
        const values = row.split(',').map((v) => v.trim())
        const obj: Record<string, string> = {}
        cols.forEach((c, i) => (obj[c] = values[i] || ''))
        return {
          firstName: obj.firstname || obj.prenom || '',
          lastName: obj.lastname || obj.nom || '',
          email: obj.email || undefined,
          phone: obj.phone || obj.telephone || undefined,
          company: obj.company || obj.entreprise || undefined,
        }
      }).filter((c) => c.firstName && c.lastName)
      const { data } = await api.post('/contacts/import', { contacts })
      setResult(`${data.created} contact(s) importe(s) avec succes.`)
      onImported()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Importer des contacts (CSV)" wide>
      <p className="mb-2 text-sm text-brand-500">
        Collez le contenu CSV avec en-tetes : firstName,lastName,email,phone,company (ou prenom,nom,email,telephone,entreprise)
      </p>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={8}
        placeholder={'firstName,lastName,email,phone,company\nJean,Dupont,jean@example.com,0612345678,ACME'}
        className="mb-3 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {result && <p className="mb-2 text-sm text-green-600">{result}</p>}
      <Button onClick={handleImport} className="w-full">Importer</Button>
    </Modal>
  )
}
