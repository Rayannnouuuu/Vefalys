import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card } from '../../components/ui'
import { useAuthStore } from '../../store/auth'
import type { Permission } from '../../types'
import { SettingsSection } from './SettingsLayout'

export default function PermissionsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'ADMIN'
  const queryClient = useQueryClient()
  const { data: permissions } = useQuery<Permission[]>({ queryKey: ['permissions'], queryFn: () => api.get('/permissions').then((r) => r.data) })

  async function toggle(key: string, enabled: boolean) {
    await api.patch(`/permissions/${key}`, { enabled })
    queryClient.invalidateQueries({ queryKey: ['permissions'] })
  }

  return (
    <SettingsSection
      title="Permissions"
      description="Les roles Admin et Manager ont toujours acces complet. Ces options etendent, cas par cas, les droits du role Collaborateur, restreint par defaut."
    >
      <Card className="divide-y divide-brand-100 p-0 dark:divide-brand-800">
        {permissions?.map((p) => (
          <label key={p.key} className="flex items-center justify-between p-4 text-sm">
            <span className="text-brand-800 dark:text-brand-100">{p.label}</span>
            <input
              type="checkbox"
              checked={p.enabled}
              disabled={!isAdmin}
              onChange={(e) => toggle(p.key, e.target.checked)}
              className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-400 disabled:opacity-50"
            />
          </label>
        ))}
      </Card>
      {!isAdmin && <p className="text-xs text-brand-400">Seul un administrateur peut modifier ces reglages.</p>}
    </SettingsSection>
  )
}
