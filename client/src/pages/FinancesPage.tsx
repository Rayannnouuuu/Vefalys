import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { api } from '../lib/api'
import { Card } from '../components/ui'
import { DEPENSE_CATEGORIES, labelFor } from '../lib/enums'

const COLORS = ['#397a52', '#6fb085', '#c9a04d', '#9bcaac', '#735129', '#20412e']

export default function FinancesPage() {
  const { data } = useQuery({ queryKey: ['dashboard', 'financial'], queryFn: () => api.get('/dashboard/financial').then((r) => r.data) })
  if (!data) return null

  const caByMonth = Object.entries(data.caByMonth as Record<string, number>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))

  const depensesChart = Object.entries(data.depensesByCategory as Record<string, number>).map(([cat, amount]) => ({
    name: labelFor(DEPENSE_CATEGORIES, cat),
    amount,
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <h1 className="font-serif text-2xl font-medium text-brand-900">Vue financiere</h1>

      <div className="grid grid-cols-5 gap-4">
        <Kpi label="CA TTC" value={`${data.totalTTC.toLocaleString('fr-FR')} EUR`} />
        <Kpi label="Encaisse" value={`${data.totalPaid.toLocaleString('fr-FR')} EUR`} color="text-green-600" />
        <Kpi label="Impaye" value={`${data.totalUnpaid.toLocaleString('fr-FR')} EUR`} color="text-red-600" />
        <Kpi label="Depenses" value={`${data.totalDepenses.toLocaleString('fr-FR')} EUR`} />
        <Kpi label="Tresorerie" value={`${data.tresorerie.toLocaleString('fr-FR')} EUR`} color={data.tresorerie >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-500">Chiffre d'affaires par mois</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={caByMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} EUR`} />
              <Line type="monotone" dataKey="amount" stroke="#397a52" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-500">Depenses par categorie</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={depensesChart} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {depensesChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} EUR`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-brand-500">Benefice brut</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={[{ name: 'Benefice brut (CA - Depenses)', amount: data.beneficeBrut }]} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={220} />
            <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} EUR`} />
            <Bar dataKey="amount" fill={data.beneficeBrut >= 0 ? '#397a52' : '#dc2626'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </motion.div>
  )
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <p className="text-xs text-brand-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${color || 'text-brand-900'}`}>{value}</p>
    </Card>
  )
}
