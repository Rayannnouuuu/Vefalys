import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, type AuthedRequest } from '../middleware/auth'
import { requirePermission } from '../lib/permissions'

const router = Router()
router.use(authenticate)

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function startOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay() || 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day + 1)
  return date
}

router.get(
  '/commercial',
  asyncHandler(async (_req: AuthedRequest, res) => {
    const [contactsByStatus, pipelineByStage, relancesThisWeek, closedThisMonth, contacts] = await Promise.all([
      prisma.contact.groupBy({ by: ['status'], _count: { _all: true }, where: { archivedAt: null } }),
      prisma.opportunity.groupBy({ by: ['stage'], _sum: { amount: true }, _count: { _all: true } }),
      prisma.relance.count({
        where: { status: 'A_FAIRE', dueDate: { gte: startOfWeek(), lte: new Date(startOfWeek().getTime() + 7 * 86400000) } },
      }),
      prisma.opportunity.findMany({ where: { stage: 'FERME_GAGNE', closedAt: { gte: startOfMonth() } } }),
      prisma.contact.findMany({ select: { status: true, source: true, archivedAt: true } }),
    ])

    const activeContacts = contacts.filter((c) => !c.archivedAt)
    const coldCount = activeContacts.filter((c) => c.status === 'PROSPECT_FROID').length
    const coldPct = activeContacts.length ? Math.round((coldCount / activeContacts.length) * 100) : 0

    const bySource: Record<string, number> = {}
    for (const c of activeContacts) bySource[c.source] = (bySource[c.source] || 0) + 1

    const staleThreshold = new Date(Date.now() - 14 * 86400000)
    const staleOpportunities = await prisma.opportunity.count({
      where: { stage: { notIn: ['FERME_GAGNE', 'FERME_PERDU'] }, updatedAt: { lt: staleThreshold } },
    })

    const insights: string[] = []
    if (coldPct > 10) insights.push(`Vous avez ${coldPct}% de prospects froids, pensez a les relancer.`)
    if (relancesThisWeek > 0) insights.push(`${relancesThisWeek} relance(s) a faire cette semaine.`)
    if (staleOpportunities > 0) insights.push(`${staleOpportunities} dossier(s) bloque(s) depuis plus de 14 jours sans avancement.`)

    res.json({
      contactsByStatus,
      pipelineByStage,
      relancesThisWeek,
      closedThisMonthCount: closedThisMonth.length,
      closedThisMonthAmount: closedThisMonth.reduce((s, o) => s + o.amount, 0),
      contactsBySource: bySource,
      totalContacts: activeContacts.length,
      staleOpportunities,
      insights,
    })
  }),
)

router.get(
  '/financial',
  requirePermission('COLLAB_VIEW_FINANCES'),
  asyncHandler(async (_req, res) => {
    const [factures, depenses] = await Promise.all([
      prisma.facture.findMany({ include: { items: true, paiements: true } }),
      prisma.depense.findMany(),
    ])

    let totalHT = 0
    let totalTTC = 0
    let totalPaid = 0
    let totalUnpaid = 0
    const caByMonth: Record<string, number> = {}

    for (const f of factures) {
      if (f.status === 'ANNULEE') continue
      const ht = f.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      const ttc = f.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.vatRate / 100), 0)
      const paid = f.paiements.reduce((s, p) => s + p.amount, 0)
      totalHT += ht
      totalTTC += ttc
      totalPaid += paid
      if (paid < ttc) totalUnpaid += ttc - paid
      const key = `${f.issueDate.getFullYear()}-${String(f.issueDate.getMonth() + 1).padStart(2, '0')}`
      caByMonth[key] = (caByMonth[key] || 0) + ttc
    }

    const totalDepenses = depenses.reduce((s, d) => s + d.amount, 0)
    const depensesByCategory: Record<string, number> = {}
    for (const d of depenses) depensesByCategory[d.category] = (depensesByCategory[d.category] || 0) + d.amount

    res.json({
      totalHT: Math.round(totalHT * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalUnpaid: Math.round(totalUnpaid * 100) / 100,
      totalDepenses: Math.round(totalDepenses * 100) / 100,
      beneficeBrut: Math.round((totalTTC - totalDepenses) * 100) / 100,
      tresorerie: Math.round((totalPaid - totalDepenses) * 100) / 100,
      caByMonth,
      depensesByCategory,
    })
  }),
)

router.get(
  '/analytics',
  asyncHandler(async (_req, res) => {
    const [contacts, opportunities] = await Promise.all([
      prisma.contact.findMany({ where: { archivedAt: null }, select: { source: true, status: true, createdAt: true } }),
      prisma.opportunity.findMany({ include: { contact: { select: { source: true } } } }),
    ])

    // ROI par source : nombre de prospects, deals gagnes, CA genere
    const bySource: Record<string, { contacts: number; won: number; wonAmount: number }> = {}
    for (const c of contacts) {
      bySource[c.source] ??= { contacts: 0, won: 0, wonAmount: 0 }
      bySource[c.source].contacts++
    }
    for (const o of opportunities) {
      const source = o.contact.source
      bySource[source] ??= { contacts: 0, won: 0, wonAmount: 0 }
      if (o.stage === 'FERME_GAGNE') {
        bySource[source].won++
        bySource[source].wonAmount += o.amount
      }
    }

    // Prevision ponderee : somme (montant x probabilite) des opportunites encore ouvertes
    const openOpportunities = opportunities.filter((o) => !['FERME_GAGNE', 'FERME_PERDU'].includes(o.stage))
    const forecast = Math.round(openOpportunities.reduce((s, o) => s + (o.amount * o.probability) / 100, 0))

    // Tendance des 6 derniers mois : nouveaux contacts + CA gagne
    const trend: { month: string; newContacts: number; wonAmount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
      const newContacts = contacts.filter((c) => c.createdAt >= monthStart && c.createdAt < monthEnd).length
      const wonAmount = opportunities
        .filter((o) => o.stage === 'FERME_GAGNE' && o.closedAt && o.closedAt >= monthStart && o.closedAt < monthEnd)
        .reduce((s, o) => s + o.amount, 0)
      trend.push({ month: key, newContacts, wonAmount })
    }

    res.json({ bySource, forecast, trend })
  }),
)

router.get(
  '/immobilier',
  asyncHandler(async (_req, res) => {
    const dossiers = await prisma.prospectProgram.findMany({ include: { program: true, commissions: true } })
    const signed = dossiers.filter((d) => d.stage === 'ACTE_SIGNE' && d.signedAt)
    const avgDaysToSign = signed.length
      ? Math.round(
          signed.reduce((s, d) => s + (d.signedAt!.getTime() - d.createdAt.getTime()) / 86400000, 0) / signed.length,
        )
      : null
    const conversionRate = dossiers.length ? Math.round((signed.length / dossiers.length) * 100) : 0

    const byProgram: Record<string, { name: string; ca: number; dossiers: number; signed: number }> = {}
    for (const d of dossiers) {
      byProgram[d.programId] ??= { name: d.program.name, ca: 0, dossiers: 0, signed: 0 }
      byProgram[d.programId].dossiers++
      if (d.stage === 'ACTE_SIGNE') byProgram[d.programId].signed++
      byProgram[d.programId].ca += d.commissions.reduce((s, c) => s + c.amount, 0)
    }

    const commissionsAPercevoir = dossiers.flatMap((d) => d.commissions).filter((c) => c.status === 'A_PERCEVOIR')
    const commissionsFacturees = dossiers.flatMap((d) => d.commissions).filter((c) => c.status === 'FACTUREE')

    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 21)
    const staleDossiers = dossiers.filter((d) => d.updatedAt < threshold && !['ACTE_SIGNE', 'PERDU'].includes(d.stage))

    res.json({
      avgDaysToSign,
      conversionRate,
      totalDossiers: dossiers.length,
      byProgram: Object.values(byProgram),
      commissionsAPercevoirTotal: commissionsAPercevoir.reduce((s, c) => s + c.amount, 0),
      commissionsFactureesTotal: commissionsFacturees.reduce((s, c) => s + c.amount, 0),
      staleDossiersCount: staleDossiers.length,
    })
  }),
)

export default router
