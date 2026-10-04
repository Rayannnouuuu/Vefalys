import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, Button, Modal, Label, Input, Select, Textarea, Badge } from '../../components/ui'
import type { Tag } from '../../types'
import { SettingsSection } from './SettingsLayout'

export default function DataPage() {
  const queryClient = useQueryClient()
  const [showTag, setShowTag] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)

  const { data: tags } = useQuery<Tag[]>({ queryKey: ['tags'], queryFn: () => api.get('/tags').then((r) => r.data) })
  const { data: templates } = useQuery({ queryKey: ['relance-templates'], queryFn: () => api.get('/relances/templates/all').then((r) => r.data) })

  async function removeTag(id: string) {
    await api.delete(`/tags/${id}`)
    queryClient.invalidateQueries({ queryKey: ['tags'] })
  }

  return (
    <>
      <SettingsSection title="Tags" description="Etiquettes utilisees pour categoriser les contacts.">
        <Card>
          <div className="mb-3 flex justify-end">
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
      </SettingsSection>

      <SettingsSection title="Modeles de relance" description="Textes reutilisables pour les relances email et SMS.">
        <Card>
          <div className="mb-3 flex justify-end">
            <Button variant="secondary" onClick={() => setShowTemplate(true)}><Plus size={14} /> Nouveau modele</Button>
          </div>
          <div className="space-y-2">
            {templates?.map((t: any) => (
              <div key={t.id} className="rounded border border-brand-100 p-2 text-sm dark:border-brand-800">
                <p className="font-medium">{t.name} <Badge label={t.channel} /></p>
                {t.subject && <p className="text-xs text-brand-400">Sujet : {t.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-xs text-brand-500">{t.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </SettingsSection>

      <CreateTagModal open={showTag} onClose={() => setShowTag(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['tags'] }); setShowTag(false) }} />
      <CreateTemplateModal open={showTemplate} onClose={() => setShowTemplate(false)} onCreated={() => { queryClient.invalidateQueries({ queryKey: ['relance-templates'] }); setShowTemplate(false) }} />
    </>
  )
}

function CreateTagModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2d5c44')
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
