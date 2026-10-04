import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '../lib/api'

export default function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get('/search', { params: { q } }).then((r) => r.data),
    enabled: q.length > 1,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const hasResults = data && (data.contacts.length || data.opportunities.length || data.factures.length || data.programs.length)

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 dark:bg-slate-800">
        <Search size={16} className="text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un contact, une facture, un programme..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      {open && q.length > 1 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg dark:bg-slate-900">
          {!hasResults && <p className="p-3 text-sm text-slate-400">Aucun resultat</p>}
          {data?.contacts?.length > 0 && (
            <div className="border-b p-2">
              <p className="px-2 text-xs font-semibold text-slate-400">Contacts</p>
              {data.contacts.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => {
                    navigate(`/contacts/${c.id}`)
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {c.firstName} {c.lastName} {c.company ? `- ${c.company}` : ''}
                </button>
              ))}
            </div>
          )}
          {data?.programs?.length > 0 && (
            <div className="border-b p-2">
              <p className="px-2 text-xs font-semibold text-slate-400">Programmes</p>
              {data.programs.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    navigate(`/programmes/${p.id}`)
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {p.name} - {p.city}
                </button>
              ))}
            </div>
          )}
          {data?.factures?.length > 0 && (
            <div className="border-b p-2">
              <p className="px-2 text-xs font-semibold text-slate-400">Factures</p>
              {data.factures.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => {
                    navigate(`/factures/${f.id}`)
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {f.number} - {f.contact?.firstName} {f.contact?.lastName}
                </button>
              ))}
            </div>
          )}
          {data?.opportunities?.length > 0 && (
            <div className="p-2">
              <p className="px-2 text-xs font-semibold text-slate-400">Opportunites</p>
              {data.opportunities.map((o: any) => (
                <button
                  key={o.id}
                  onClick={() => {
                    navigate(`/pipeline`)
                    setOpen(false)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {o.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
