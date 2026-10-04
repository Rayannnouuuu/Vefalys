import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Columns3,
  Receipt,
  Wallet,
  CalendarDays,
  CheckSquare,
  BellRing,
  LineChart,
  Calculator,
  Moon,
  Sun,
  LogOut,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import { useCan } from '../lib/permissions'
import GlobalSearch from './GlobalSearch'
import NotificationsBell from './NotificationsBell'
import { Logo } from './Logo'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { to: '/relances', label: 'Relances', icon: BellRing },
  { to: '/factures', label: 'Factures', icon: Receipt },
  { to: '/depenses', label: 'Depenses', icon: Wallet },
  { to: '/finances', label: 'Finances', icon: LineChart, permission: 'COLLAB_VIEW_FINANCES' },
  { to: '/simulation', label: 'Simulation', icon: Calculator },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/taches', label: 'Taches', icon: CheckSquare },
  { to: '/parametres', label: 'Parametres', icon: Settings },
]

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const canViewFinances = useCan('COLLAB_VIEW_FINANCES')
  const visibleNav = NAV.filter((item) => !item.permission || canViewFinances)
  const logout = useAuthStore((s) => s.logout)
  const dark = useThemeStore((s) => s.dark)
  const toggle = useThemeStore((s) => s.toggle)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r border-brand-100 bg-white dark:border-brand-800 dark:bg-brand-900">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-subtle'
                    : 'text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800',
                )
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-100 p-3 dark:border-brand-800">
          <div className="flex items-center gap-2 rounded-lg p-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: user?.avatarColor }}
            >
              {user?.firstName[0]}
              {user?.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-900 dark:text-brand-50">{user?.firstName} {user?.lastName}</p>
              <p className="truncate text-xs text-brand-400">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/connexion')
              }}
              className="rounded p-1.5 text-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-800"
              title="Se deconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 px-2 pt-2 text-[11px] text-brand-300">
            <Link to="/mentions-legales" className="hover:text-brand-500 hover:underline">Mentions legales</Link>
            <span>{'·'}</span>
            <Link to="/cgu" className="hover:text-brand-500 hover:underline">CGU</Link>
            <span>{'·'}</span>
            <Link to="/confidentialite" className="hover:text-brand-500 hover:underline">Confidentialite</Link>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-brand-100 bg-white px-6 py-3 dark:border-brand-800 dark:bg-brand-900">
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 text-brand-500 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationsBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#f7faf8] p-6 dark:bg-brand-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
