import { useQuery } from '@tanstack/react-query'
import { motion, type Variants } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Lightbulb, TrendingUp, Users, BellRing, Receipt, Target } from 'lucide-react'
import { api } from '../lib/api'
import { Card } from '../components/ui'
import { labelFor, OPPORTUNITY_STAGES, CONTACT_STATUSES, CONTACT_SOURCES } from '../lib/enums'
import { useCan } from '../lib/permissions'
import { CHART_COLORS as COLORS } from '../lib/chartColors'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] } }),
}

export default function DashboardPage() {
  const canViewFinances = useCan('COLLAB_VIEW_FINANCES')
  const { data } = useQuery({ queryKey: ['dashboard', 'commercial'], queryFn: () => api.get('/dashboard/commercial').then((r) => r.data) })
  const { data: financial } = useQuery({
    queryKey: ['dashboard', 'financial'],
    queryFn: () => api.get('/dashboard/financial').then((r) => r.data),
    enabled: canViewFinances,
  })
  const { data: analytics } = useQuery({ queryKey: ['dashboard', 'analytics'], queryFn: () => api.get('/dashboard/analytics').then((r) => r.data) })

  if (!data) return null

  const pipelineChart = data.pipelineByStage.map((p: any) => ({ name: labelFor(OPPORTUNITY_STAGES, p.stage), amount: p._sum.amount || 0 }))
  const statusChart = data.contactsByStatus.map((s: any) => ({ name: labelFor(CONTACT_STATUSES, s.status), value: s._count._all }))
  const sourceRows = analytics ? Object.entries(analytics.bySource as Record<string, { contacts: number; won: number; wonAmount: number }>) : []
  const trendChart = analytics?.trend.map((t: any) => ({ ...t, label: t.month.slice(5) })) || []

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-brand-900">Tableau de bord</h1>

      {data.insights.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="space-y-2">
          {data.insights.map((insight: string, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700">
              <Lightbulb size={16} />
              {insight}
            </div>
          ))}
        </motion.div>
      )}

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={1}
        className={`grid gap-4 ${canViewFinances ? 'grid-cols-5' : 'grid-cols-4'}`}
      >
        <Card>
          <div className="flex items-center gap-2 text-brand-400">
            <Users size={16} />
            <span className="text-xs">Contacts actifs</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{data.totalContacts}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-brand-400">
            <BellRing size={16} />
            <span className="text-xs">Relances cette semaine</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{data.relancesThisWeek}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-brand-400">
            <TrendingUp size={16} />
            <span className="text-xs">Deals fermes ce mois</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{data.closedThisMonthCount}</p>
          <p className="text-xs text-brand-400">{data.closedThisMonthAmount.toLocaleString('fr-FR')} EUR</p>
        </Card>
        {canViewFinances && (
          <Card>
            <div className="flex items-center gap-2 text-brand-400">
              <Receipt size={16} />
              <span className="text-xs">Factures en attente</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-brand-900">{financial ? financial.totalUnpaid.toLocaleString('fr-FR') : '-'} EUR</p>
          </Card>
        )}
        <Card>
          <div className="flex items-center gap-2 text-brand-400">
            <Target size={16} />
            <span className="text-xs">Prevision ponderee</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{analytics ? analytics.forecast.toLocaleString('fr-FR') : '-'} EUR</p>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-500">Pipeline commercial par etape (montant)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineChart}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} EUR`} />
              <Bar dataKey="amount" fill="#2d5c44" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-500">Contacts par statut</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusChart.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {analytics && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="grid grid-cols-2 gap-4">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-brand-500">Tendance 6 derniers mois</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendChart}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="newContacts" name="Nouveaux contacts" stroke="#2d5c44" strokeWidth={2} />
                <Line type="monotone" dataKey="wonAmount" name="CA gagne" stroke="#b8944f" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-brand-500">Performance par source d'acquisition</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-left text-brand-400">
                  <th className="py-2">Source</th>
                  <th>Contacts</th>
                  <th>Gagnes</th>
                  <th>CA genere</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map(([source, row]) => (
                  <tr key={source} className="border-b border-brand-100 last:border-0">
                    <td className="py-2">{labelFor(CONTACT_SOURCES, source)}</td>
                    <td>{row.contacts}</td>
                    <td>{row.won}</td>
                    <td>{row.wonAmount.toLocaleString('fr-FR')} EUR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
