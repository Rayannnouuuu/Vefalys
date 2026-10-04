import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, type Variants } from 'motion/react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Phone,
  Mail,
  Users2,
  MessageSquare,
  StickyNote,
  Plus,
  ArrowLeft,
  Pencil,
  Target,
  FileArchive,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  Download,
  Copy,
  ShieldAlert,
  Calculator,
} from 'lucide-react'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Card, Badge, Select, Textarea, Modal, Label, Input } from '../components/ui'
import { CONTACT_STATUSES, CONTACT_SOURCES, INTERACTION_TYPES, RELANCE_TYPES, PROSPECT_DOCUMENT_TYPES, labelFor, colorFor } from '../lib/enums'
import { useAuthStore } from '../store/auth'
import { useCan } from '../lib/permissions'
import type { Contact } from '../types'

const INTERACTION_ICONS: Record<string, any> = { APPEL: Phone, EMAIL: Mail, REUNION: Users2, MESSAGE: MessageSquare, NOTE: StickyNote }

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] } }),
}

export default function ContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const canDelete = useCan('COLLAB_DELETE_CONTACTS')
  const canAnonymize = useCan('COLLAB_ANONYMIZE_CONTACTS')
  const [showInteraction, setShowInteraction] = useState(false)
  const [showRelance, setShowRelance] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showCriteres, setShowCriteres] = useState(false)
  const [showDocument, setShowDocument] = useState(false)
  const [commentBody, setCommentBody] = useState('')

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contact', id],
    queryFn: () => api.get(`/contacts/${id}`).then((r) => r.data),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['contact', id] })
  }

  async function updateField(field: string, value: string | boolean) {
    await api.patch(`/contacts/${id}`, { [field]: value })
    invalidate()
  }

  async function duplicateContact() {
    const { data } = await api.post(`/contacts/${id}/duplicate`)
    navigate(`/contacts/${data.id}`)
  }

  async function exportData() {
    const res = await api.get(`/contacts/${id}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `contact-${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function anonymize() {
    if (!window.confirm('Anonymiser ce contact ? Les donnees personnelles seront definitivement supprimees. Action irreversible.')) return
    await api.post(`/contacts/${id}/anonymize`)
    navigate('/contacts')
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer definitivement ce contact ? Action irreversible.')) return
    await api.delete(`/contacts/${id}`)
    navigate('/contacts')
  }

  async function removeDocument(docId: string) {
    await api.delete(`/documents/${docId}`)
    invalidate()
  }

  async function postComment() {
    if (!commentBody.trim()) return
    await api.post('/comments', { contactId: id, body: commentBody })
    setCommentBody('')
    invalidate()
  }

  if (isLoading || !contact) return <p className="text-sm text-brand-400">Chargement...</p>

  const hasCriteres = contact.budgetMin || contact.budgetMax || contact.typologieRecherchee || contact.localisationSouhaitee || contact.financement || contact.criteresNotes
  const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/contacts')} className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-700">
          <ArrowLeft size={14} /> Retour aux contacts
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={duplicateContact}><Copy size={14} /> Dupliquer</Button>
          {isManager && <Button variant="ghost" onClick={exportData}><Download size={14} /> Exporter (RGPD)</Button>}
          {canAnonymize && <Button variant="ghost" onClick={anonymize}><ShieldAlert size={14} /> Anonymiser</Button>}
          {canDelete && <Button variant="danger" onClick={handleDelete}><Trash2 size={14} /> Supprimer</Button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-serif text-xl font-semibold text-brand-900">{contact.firstName} {contact.lastName}</h1>
                  <p className="text-sm text-brand-400">{contact.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={labelFor(CONTACT_STATUSES, contact.status)} color={colorFor(CONTACT_STATUSES, contact.status)} />
                  <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={14} /> Modifier</Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-brand-400">Email : </span>{contact.email || '-'}</div>
                <div><span className="text-brand-400">Telephone : </span>{contact.phone || '-'}</div>
                <div><span className="text-brand-400">Secteur : </span>{contact.sector || '-'}</div>
                <div><span className="text-brand-400">Localisation : </span>{contact.location || '-'}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <Label>Statut</Label>
                  <Select value={contact.status} onChange={(e) => updateField('status', e.target.value)}>
                    {CONTACT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Source d'acquisition</Label>
                  <Select value={contact.source} onChange={(e) => updateField('source', e.target.value)}>
                    {CONTACT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label>Notes internes</Label>
                <Textarea
                  defaultValue={contact.notes || ''}
                  rows={3}
                  onBlur={(e) => updateField('notes', e.target.value)}
                  placeholder="Notes privees sur ce contact..."
                />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-500"><Target size={15} /> Criteres de recherche</h2>
                <Button variant="secondary" onClick={() => setShowCriteres(true)}><Pencil size={14} /> {hasCriteres ? 'Modifier' : 'Renseigner'}</Button>
              </div>
              {!hasCriteres && <p className="text-sm text-brand-400">Aucun critere renseigne pour ce prospect.</p>}
              {!!hasCriteres && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-brand-400">Budget : </span>{formatBudget(contact.budgetMin, contact.budgetMax)}</div>
                  <div><span className="text-brand-400">Typologie recherchee : </span>{contact.typologieRecherchee || '-'}</div>
                  <div><span className="text-brand-400">Localisation souhaitee : </span>{contact.localisationSouhaitee || '-'}</div>
                  <div><span className="text-brand-400">Financement : </span>{contact.financement || '-'}</div>
                  {contact.criteresNotes && <div className="col-span-2"><span className="text-brand-400">Notes : </span>{contact.criteresNotes}</div>}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-brand-500">Checklist dossier</h2>
              <div className="space-y-2">
                <ChecklistRow
                  label="Mandat de vente signe"
                  checked={contact.mandatSigned}
                  date={contact.mandatSignedDate}
                  onToggle={() => updateField('mandatSigned', !contact.mandatSigned)}
                />
                <ChecklistRow
                  label="Preuve de financement"
                  checked={contact.financingProofUploaded}
                  date={contact.financingProofDate}
                  onToggle={() => updateField('financingProofUploaded', !contact.financingProofUploaded)}
                />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-500"><FileArchive size={15} /> Documents archives</h2>
                <Button variant="secondary" onClick={() => setShowDocument(true)}><Upload size={14} /> Ajouter un document</Button>
              </div>
              {!contact.documents?.length && <p className="text-sm text-brand-400">Aucun document archive.</p>}
              <div className="space-y-2">
                {contact.documents?.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-brand-100 p-2 text-sm">
                    <div>
                      <a href={d.filePath} target="_blank" rel="noreferrer" className="font-medium hover:underline">{d.name}</a>
                      <p className="text-xs text-brand-400">
                        {labelFor(PROSPECT_DOCUMENT_TYPES, d.type)} - {format(new Date(d.uploadedAt), 'dd/MM/yyyy')}
                        {d.uploadedBy && ` - ${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`}
                      </p>
                    </div>
                    <button onClick={() => removeDocument(d.id)} className="text-brand-300 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-brand-500">Historique des interactions</h2>
                <Button variant="secondary" onClick={() => setShowInteraction(true)}><Plus size={14} /> Ajouter</Button>
              </div>
              <div className="space-y-3">
                {!contact.interactions?.length && <p className="text-sm text-brand-400">Aucune interaction enregistree.</p>}
                {contact.interactions?.map((i) => {
                  const Icon = INTERACTION_ICONS[i.type] || StickyNote
                  return (
                    <div key={i.id} className="flex gap-3 border-b border-brand-100 pb-3 last:border-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50">
                        <Icon size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{i.subject || labelFor(INTERACTION_TYPES, i.type)}</p>
                          <p className="text-xs text-brand-400">{formatDistanceToNow(new Date(i.occurredAt), { addSuffix: true, locale: fr })}</p>
                        </div>
                        {i.content && <p className="mt-0.5 text-sm text-brand-500">{i.content}</p>}
                        {i.user && <p className="mt-0.5 text-xs text-brand-400">par {i.user.firstName} {i.user.lastName}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-brand-500">Relances</h2>
                <Button variant="secondary" onClick={() => setShowRelance(true)}><Plus size={14} /></Button>
              </div>
              <div className="space-y-2">
                {!contact.relances?.length && <p className="text-sm text-brand-400">Aucune relance programmee.</p>}
                {contact.relances?.map((r) => (
                  <div key={r.id} className="rounded-lg border border-brand-100 p-2 text-sm">
                    <p className="font-medium">{labelFor(RELANCE_TYPES, r.type)}</p>
                    <p className="text-xs text-brand-400">{format(new Date(r.dueDate), 'dd/MM/yyyy')} - {r.status}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-brand-500">Commentaires d'equipe</h2>
              <div className="mb-3 space-y-2">
                <Textarea rows={2} value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Ajouter un commentaire pour l'equipe..." />
                <Button variant="secondary" onClick={postComment} className="w-full">Publier</Button>
              </div>
              <div className="space-y-3">
                {!contact.comments?.length && <p className="text-sm text-brand-400">Aucun commentaire.</p>}
                {contact.comments?.map((c) => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: c.user?.avatarColor || '#2d5c44' }}
                    >
                      {c.user?.firstName[0]}{c.user?.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-brand-700">{c.body}</p>
                      <p className="text-xs text-brand-400">{c.user?.firstName} {c.user?.lastName} - {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: fr })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-500"><Calculator size={15} /> Simulations financiÃ¨res</h2>
                <Link to={`/simulation?contactId=${id}`}><Button variant="secondary"><Plus size={14} /> Nouvelle</Button></Link>
              </div>
              {!contact.simulations?.length && <p className="text-sm text-brand-400">Aucune simulation rÃ©alisÃ©e pour ce prospect.</p>}
              <div className="space-y-2">
                {contact.simulations?.map((s) => (
                  <div key={s.id} className="rounded-lg border border-brand-100 p-2 text-sm">
                    <p className="font-medium text-brand-800">{Math.round(s.budgetTotalAvecPtz ?? s.budgetFinancable).toLocaleString('fr-FR')} EUR finanÃ§ables</p>
                    <p className="text-xs text-brand-400">
                      {format(new Date(s.createdAt), 'dd/MM/yyyy')}{s.ptzEligible ? ' - PTZ eligible' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-brand-500">Factures</h2>
              {!contact.factures?.length && <p className="text-sm text-brand-400">Aucune facture.</p>}
              {contact.factures?.map((f: any) => (
                <Link key={f.id} to={`/factures/${f.id}`} className="block rounded-lg border border-brand-100 p-2 text-sm hover:bg-brand-50">
                  {f.reference || f.number}
                </Link>
              ))}
            </Card>
          </motion.div>
        </div>
      </div>

      <AddInteractionModal open={showInteraction} onClose={() => setShowInteraction(false)} contactId={id!} onDone={() => { invalidate(); setShowInteraction(false) }} />
      <AddRelanceModal open={showRelance} onClose={() => setShowRelance(false)} contactId={id!} onDone={() => { invalidate(); setShowRelance(false) }} />
      <EditContactModal open={showEdit} onClose={() => setShowEdit(false)} contact={contact} onDone={() => { invalidate(); setShowEdit(false) }} />
      <EditCriteresModal open={showCriteres} onClose={() => setShowCriteres(false)} contact={contact} onDone={() => { invalidate(); setShowCriteres(false) }} />
      <AddDocumentModal open={showDocument} onClose={() => setShowDocument(false)} contactId={id!} onDone={() => { invalidate(); setShowDocument(false) }} />
    </div>
  )
}

function ChecklistRow({ label, checked, date, onToggle }: { label: string; checked: boolean; date?: string | null; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-brand-100 p-3 text-left text-sm transition-colors hover:bg-brand-50"
    >
      <span className="flex items-center gap-2">
        {checked ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} className="text-brand-300" />}
        {label}
      </span>
      {checked && date && <span className="text-xs text-brand-400">le {format(new Date(date), 'dd/MM/yyyy')}</span>}
    </button>
  )
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return '-'
  if (min && max) return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} EUR`
  if (min) return `A partir de ${min.toLocaleString('fr-FR')} EUR`
  return `Jusqu'a ${max!.toLocaleString('fr-FR')} EUR`
}

function EditContactModal({ open, onClose, contact, onDone }: { open: boolean; onClose: () => void; contact: Contact; onDone: () => void }) {
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    sector: contact.sector || '',
    location: contact.location || '',
  })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.patch(`/contacts/${contact.id}`, form)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier le contact">
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
          <div><Label>Secteur</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></div>
        </div>
        <div><Label>Localisation</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function EditCriteresModal({ open, onClose, contact, onDone }: { open: boolean; onClose: () => void; contact: Contact; onDone: () => void }) {
  const [form, setForm] = useState({
    budgetMin: contact.budgetMin?.toString() || '',
    budgetMax: contact.budgetMax?.toString() || '',
    typologieRecherchee: contact.typologieRecherchee || '',
    localisationSouhaitee: contact.localisationSouhaitee || '',
    financement: contact.financement || '',
    criteresNotes: contact.criteresNotes || '',
  })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.patch(`/contacts/${contact.id}`, {
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      })
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Criteres de recherche du prospect">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Budget minimum (EUR)</Label><Input type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} /></div>
          <div><Label>Budget maximum (EUR)</Label><Input type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} /></div>
        </div>
        <div><Label>Typologie recherchee</Label><Input value={form.typologieRecherchee} onChange={(e) => setForm({ ...form, typologieRecherchee: e.target.value })} placeholder="Ex: T3, maison 4 pieces..." /></div>
        <div><Label>Localisation souhaitee</Label><Input value={form.localisationSouhaitee} onChange={(e) => setForm({ ...form, localisationSouhaitee: e.target.value })} /></div>
        <div><Label>Financement</Label><Input value={form.financement} onChange={(e) => setForm({ ...form, financement: e.target.value })} placeholder="Ex: pret bancaire 90%, comptant..." /></div>
        <div><Label>Notes</Label><Textarea rows={3} value={form.criteresNotes} onChange={(e) => setForm({ ...form, criteresNotes: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function AddDocumentModal({ open, onClose, contactId, onDone }: { open: boolean; onClose: () => void; contactId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('MANDAT')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Selectionnez un fichier')
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('contactId', contactId)
      formData.append('name', name || file.name)
      formData.append('type', type)
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setName('')
      setFile(null)
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un document">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><Label>Nom du document</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mandat de vente signe" /></div>
        <div>
          <Label>Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {PROSPECT_DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Fichier</Label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Archiver</Button>
      </form>
    </Modal>
  )
}

function AddInteractionModal({ open, onClose, contactId, onDone }: { open: boolean; onClose: () => void; contactId: string; onDone: () => void }) {
  const [form, setForm] = useState({ type: 'APPEL', subject: '', content: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/interactions', { ...form, contactId })
      setForm({ type: 'APPEL', subject: '', content: '' })
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une interaction">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {INTERACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div><Label>Sujet</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><Label>Details</Label><Textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Enregistrer</Button>
      </form>
    </Modal>
  )
}

function AddRelanceModal({ open, onClose, contactId, onDone }: { open: boolean; onClose: () => void; contactId: string; onDone: () => void }) {
  const [form, setForm] = useState({ type: 'RELANCE_PROSPECT', dueDate: format(new Date(), 'yyyy-MM-dd'), note: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/relances', { ...form, contactId })
      onDone()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Programmer une relance">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {RELANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div><Label>Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
        <div><Label>Note</Label><Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Programmer</Button>
      </form>
    </Modal>
  )
}
