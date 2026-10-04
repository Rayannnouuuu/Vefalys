import { prisma } from '../lib/prisma'
import { createNotification } from '../lib/notifications'

// Balayage periodique : transforme les echeances (relances, factures impayees, RDV proches)
// en notifications in-app, sans doublon (on verifie qu'aucune notification pointant vers la
// meme ressource n'existe deja).
export async function runNotificationSweep() {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const dueRelances = await prisma.relance.findMany({
    where: { status: 'A_FAIRE', dueDate: { lte: in24h } },
    include: { contact: true, assignedTo: true },
  })
  for (const r of dueRelances) {
    if (!r.assignedToId) continue
    const link = `/relances`
    const exists = await prisma.notification.findFirst({ where: { userId: r.assignedToId, type: 'RELANCE', message: { contains: r.id } } })
    if (!exists) {
      const who = r.contact ? `${r.contact.firstName} ${r.contact.lastName}` : 'un contact'
      await createNotification(r.assignedToId, 'RELANCE', 'Relance a faire', `Relance pour ${who} (id:${r.id})`, link)
    }
  }

  const overdueFactures = await prisma.facture.findMany({
    where: { dueDate: { lt: now }, status: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'IMPAYEE'] } },
    include: { contact: true, createdBy: true },
  })
  for (const f of overdueFactures) {
    if (f.status !== 'IMPAYEE') {
      await prisma.facture.update({ where: { id: f.id }, data: { status: f.status === 'PARTIELLEMENT_PAYEE' ? f.status : 'IMPAYEE' } })
    }
    if (!f.createdById) continue
    const exists = await prisma.notification.findFirst({ where: { userId: f.createdById, type: 'FACTURE_IMPAYEE', message: { contains: f.number } } })
    if (!exists) {
      await createNotification(
        f.createdById,
        'FACTURE_IMPAYEE',
        'Facture impayee',
        `La facture ${f.number} (${f.contact.firstName} ${f.contact.lastName}) est en retard de paiement.`,
        `/factures`,
      )
    }
  }

  const upcomingAppointments = await prisma.appointment.findMany({
    where: { startAt: { gte: now, lte: new Date(now.getTime() + 60 * 60 * 1000) } },
    include: { contact: true },
  })
  for (const a of upcomingAppointments) {
    if (!a.createdById) continue
    const exists = await prisma.notification.findFirst({ where: { userId: a.createdById, type: 'RDV', message: { contains: a.id } } })
    if (!exists) {
      await createNotification(a.createdById, 'RDV', 'Rendez-vous a venir', `${a.title} (id:${a.id})`, `/agenda`)
    }
  }

  // Dossiers (opportunites) bloques depuis plus de 14 jours sans avancement
  const staleThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const staleOpportunities = await prisma.opportunity.findMany({
    where: { stage: { notIn: ['FERME_GAGNE', 'FERME_PERDU'] }, updatedAt: { lt: staleThreshold } },
    include: { contact: true },
  })
  for (const o of staleOpportunities) {
    const recipientId = o.ownerId
    if (!recipientId) continue
    const exists = await prisma.notification.findFirst({ where: { userId: recipientId, type: 'DOSSIER_INACTIF', message: { contains: o.id } } })
    if (!exists) {
      await createNotification(
        recipientId,
        'DOSSIER_INACTIF',
        'Dossier bloque',
        `${o.title} (${o.contact.firstName} ${o.contact.lastName}) n'a pas avance depuis plus de 14 jours. (id:${o.id})`,
        `/pipeline`,
      )
    }
  }
}
