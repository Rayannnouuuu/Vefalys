import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { api } from '../lib/api'
import { Card, Badge, Button, EmptyState } from '../components/ui'
import { RELANCE_TYPES, labelFor } from '../lib/enums'
import type { Relance } from '../types'

export default function RelancesPage() {
  const [filter, setFilter] = useState<'all' | 'today' | 'tomorrow' | 'overdue'>('all')
  const queryClient = useQueryClient()

  const { data: relances } = useQuery<Relance[]>({
    queryKey: ['relances'],
    queryFn: () => api.get('/relances', { params: { status: 'A_FAIRE' } }).then((r) => r.data),
  })

  const filtered = relances?.filter((r) => {
    const d = new Date(r.dueDate)
    if (filter === 'today') return isToday(d)
    if (filter === 'tomorrow') return isTomorrow(d)
    if (filter === 'overdue') return isPast(d) && !isToday(d)
    return true
  })

  async function markDone(id: string) {
    await api.patch(`/relances/${id}`, { status: 'FAITE' })
    queryClient.invalidateQueries({ queryKey: ['relances'] })
  }
  async function cancel(id: string) {
    await api.patch(`/relances/${id}`, { status: 'ANNULEE' })
    queryClient.invalidateQueries({ queryKey: ['relances'] })
  }

  const counts = {
    today: relances?.filter((r) => isToday(new Date(r.dueDate))).length || 0,
    tomorrow: relances?.filter((r) => isTomorrow(new Date(r.dueDate))).length || 0,
    overdue: relances?.filter((r) => isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate))).length || 0,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <h1 className="font-serif text-2xl font-medium text-brand-900">Calendrier des relances</h1>

      <div className="flex gap-2">
        {([
          ['all', `Toutes (${relances?.length || 0})`],
          ['overdue', `En retard (${counts.overdue})`],
          ['today', `Aujourd'hui (${counts.today})`],
          ['tomorrow', `Demain (${counts.tomorrow})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === key ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {!filtered?.length && <EmptyState title="Aucune relance" description="Vous etes a jour !" />}
        <AnimatePresence initial={false}>
          {filtered?.map((r) => {
            const overdue = isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate))
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between border-b border-brand-100 p-4 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge label={labelFor(RELANCE_TYPES, r.type)} color={overdue ? '#dc2626' : '#397a52'} />
                    <span className="text-sm text-brand-400">{format(new Date(r.dueDate), 'dd/MM/yyyy')}</span>
                  </div>
                  {r.contact && (
                    <Link to={`/contacts/${r.contact.id}`} className="mt-1 block text-sm font-medium text-brand-900 hover:underline">
                      {r.contact.firstName} {r.contact.lastName} {r.contact.company ? `- ${r.contact.company}` : ''}
                    </Link>
                  )}
                  {r.note && <p className="mt-0.5 text-sm text-brand-500">{r.note}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => markDone(r.id)}><Check size={14} /> Fait</Button>
                  <Button variant="ghost" onClick={() => cancel(r.id)}><X size={14} /></Button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
