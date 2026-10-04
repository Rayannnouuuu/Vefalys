import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '../store/auth'
import type { Permission } from '../types'

// ADMIN/MANAGER ont toujours acces (reflete le comportement serveur). Pour COLLABORATEUR,
// l'acces depend des permissions activees par un administrateur dans Parametres.
export function useCan(key: string): boolean {
  const role = useAuthStore((s) => s.user?.role)
  const { data } = useQuery<Permission[]>({ queryKey: ['permissions'], queryFn: () => api.get('/permissions').then((r) => r.data) })
  if (role === 'ADMIN' || role === 'MANAGER') return true
  return !!data?.find((p) => p.key === key)?.enabled
}

export function usePermissions() {
  return useQuery<Permission[]>({ queryKey: ['permissions'], queryFn: () => api.get('/permissions').then((r) => r.data) })
}
