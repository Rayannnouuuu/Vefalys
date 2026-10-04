import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { User2, Palette, Users, ShieldCheck, CalendarCheck2, Tags, History } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import clsx from 'clsx'

const SECTIONS = [
  { to: '/parametres/compte', label: 'Mon compte', icon: User2, roles: ['ADMIN', 'MANAGER', 'COLLABORATEUR'] },
  { to: '/parametres/equipe', label: 'Equipe', icon: Users, roles: ['ADMIN', 'MANAGER', 'COLLABORATEUR'] },
  { to: '/parametres/permissions', label: 'Permissions', icon: ShieldCheck, roles: ['ADMIN', 'MANAGER'] },
  { to: '/parametres/calendly', label: 'Calendly', icon: CalendarCheck2, roles: ['ADMIN', 'MANAGER', 'COLLABORATEUR'] },
  { to: '/parametres/donnees', label: 'Tags & modeles', icon: Tags, roles: ['ADMIN', 'MANAGER', 'COLLABORATEUR'] },
  { to: '/parametres/activite', label: "Journal d'activite", icon: History, roles: ['ADMIN'] },
]

export default function SettingsLayout() {
  const role = useAuthStore((s) => s.user?.role)
  const visible = SECTIONS.filter((s) => !role || s.roles.includes(role))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-brand-900">Parametres</h1>
      <div className="grid grid-cols-[200px_1fr] gap-8">
        <nav className="space-y-0.5">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-800 text-white dark:bg-brand-600'
                    : 'text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800',
                )
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 space-y-6">
          <Outlet />
        </div>
      </div>
    </motion.div>
  )
}

export function SettingsSection({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h2 className="mb-1 font-serif text-lg font-semibold text-brand-900">{title}</h2>}
      {description && <p className="mb-4 text-sm text-brand-400">{description}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
