import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { api } from '../lib/api'
import type { Notification } from '../types'

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 60_000,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = data?.filter((n) => !n.read).length || 0

  async function markAllRead() {
    await api.post('/notifications/read-all')
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await api.patch(`/notifications/${n.id}/read`)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <Bell size={18} />
        {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-80 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg dark:bg-slate-900">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          {!data?.length && <p className="p-4 text-sm text-slate-400">Aucune notification</p>}
          {data?.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`block w-full border-b p-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${!n.read ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
            >
              <p className="font-medium">{n.title}</p>
              {n.message && <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>}
              <p className="mt-1 text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
