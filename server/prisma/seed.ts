import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateFactureNumber } from '../src/lib/numbering'

const prisma = new PrismaClient()

async function main() {
  console.log('Suppression des donnees existantes...')
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.prospectDocument.deleteMany(),
    prisma.paiement.deleteMany(),
    prisma.factureItem.deleteMany(),
    prisma.facture.deleteMany(),
    prisma.devisItem.deleteMany(),
    prisma.devis.deleteMany(),
    prisma.commission.deleteMany(),
    prisma.generatedDocument.deleteMany(),
    prisma.dossierPiece.deleteMany(),
    prisma.prospectProgramHistory.deleteMany(),
    prisma.prospectProgram.deleteMany(),
    prisma.programUnit.deleteMany(),
    prisma.programDocument.deleteMany(),
    prisma.program.deleteMany(),
    prisma.opportunityHistory.deleteMany(),
    prisma.opportunity.deleteMany(),
    prisma.relance.deleteMany(),
    prisma.relanceTemplate.deleteMany(),
    prisma.task.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.interaction.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.depense.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.contactTag.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.calendlyIntegration.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log('Creation des utilisateurs...')
  const passwordHash = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.create({
    data: { email: 'admin@vefalys.fr', passwordHash, firstName: 'Camille', lastName: 'Admin', role: 'ADMIN', avatarColor: '#397a52' },
  })
  const manager = await prisma.user.create({
    data: { email: 'manager@vefalys.fr', passwordHash, firstName: 'Julien', lastName: 'Martin', role: 'MANAGER', avatarColor: '#c9a04d' },
  })
  const collab = await prisma.user.create({
    data: { email: 'collab@vefalys.fr', passwordHash, firstName: 'Sarah', lastName: 'Benali', role: 'COLLABORATEUR', avatarColor: '#6fb085' },
  })

  console.log('Creation des tags...')
  const tagVip = await prisma.tag.create({ data: { name: 'VIP', color: '#dc2626' } })
  const tagInvestisseur = await prisma.tag.create({ data: { name: 'Investisseur', color: '#735129' } })
  const tagPrimoAccedant = await prisma.tag.create({ data: { name: 'Primo-accedant', color: '#397a52' } })

  console.log('Creation des modeles de relance...')
  await prisma.relanceTemplate.createMany({
    data: [
      { name: 'Relance prospect sans suite', channel: 'EMAIL', subject: 'On reste en contact ?', body: "Bonjour {prenom},\n\nJe me permets de revenir vers vous suite a notre echange. Avez-vous eu le temps de reflechir a votre projet ?\n\nCordialement" },
      { name: 'Relance devis en attente', channel: 'EMAIL', subject: 'Votre devis est pret', body: "Bonjour {prenom},\n\nAvez-vous pu consulter le devis que je vous ai envoye ? Je reste disponible pour toute question.\n\nCordialement" },
      { name: 'Relance SMS rapide', channel: 'SMS', body: 'Bonjour {prenom}, juste un petit rappel concernant votre projet immobilier. Rappelez-moi quand vous pouvez !' },
    ],
  })

  console.log('Creation des contacts...')
  const contactsData = [
    { firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@example.com', phone: '0601020304', company: null, sector: 'Particulier', location: 'Lyon', status: 'PROSPECT_CHAUD', source: 'SITE_WEB', budgetMin: 250000, budgetMax: 320000, typologieRecherchee: 'T3', localisationSouhaitee: 'Lyon 8e, proche metro', financement: 'Pret bancaire 90%, apport 30k EUR' },
    { firstName: 'Thomas', lastName: 'Leroy', email: 'thomas.leroy@example.com', phone: '0602030405', company: null, sector: 'Particulier', location: 'Villeurbanne', status: 'PROSPECT_FROID', source: 'DIRECT', budgetMin: 180000, budgetMax: 220000, typologieRecherchee: 'T2' },
    { firstName: 'Sophie', lastName: 'Bernard', email: 'sophie.bernard@example.com', phone: '0603040506', company: null, sector: 'Particulier', location: 'Lyon', status: 'CLIENT_ACTIF', source: 'RECOMMANDATION', budgetMin: 380000, budgetMax: 420000, typologieRecherchee: 'T4', localisationSouhaitee: 'Lyon, quartier calme' },
    { firstName: 'Nicolas', lastName: 'Petit', email: 'nicolas.petit@example.com', phone: '0604050607', company: 'Petit Invest SCI', sector: 'Investissement', location: 'Caluire', status: 'PROSPECT_RELANCE', source: 'SALON', budgetMin: 400000, budgetMax: 450000, typologieRecherchee: 'T2/T3 (investissement locatif)', financement: 'Comptant' },
    { firstName: 'Claire', lastName: 'Moreau', email: 'claire.moreau@example.com', phone: '0605060708', company: null, sector: 'Particulier', location: 'Lyon', status: 'PROSPECT_CHAUD', source: 'RESEAUX_SOCIAUX', budgetMin: 230000, budgetMax: 260000 },
    { firstName: 'Antoine', lastName: 'Garcia', email: 'antoine.garcia@example.com', phone: '0606070809', company: null, sector: 'Particulier', location: 'Oullins', status: 'CLIENT_ACTIF', source: 'RECOMMANDATION' },
    { firstName: 'Julie', lastName: 'Lefevre', email: 'julie.lefevre@example.com', phone: '0607080910', company: null, sector: 'Particulier', location: 'Lyon', status: 'PERDU', source: 'DIRECT' },
    { firstName: 'Mehdi', lastName: 'Benatia', email: 'mehdi.benatia@example.com', phone: '0608091011', company: null, sector: 'Particulier', location: 'Villeurbanne', status: 'PROSPECT_FROID', source: 'SITE_WEB', budgetMin: 300000, budgetMax: 340000, typologieRecherchee: 'T3' },
    { firstName: 'Isabelle', lastName: 'Rousseau', email: 'isabelle.rousseau@example.com', phone: '0609101112', company: null, sector: 'Particulier', location: 'Lyon', status: 'CLIENT_INACTIF', source: 'AUTRE' },
    { firstName: 'Paul', lastName: 'Fontaine', email: 'paul.fontaine@example.com', phone: '0610111213', company: 'Fontaine Patrimoine', sector: 'Investissement', location: 'Lyon', status: 'PROSPECT_CHAUD', source: 'RECOMMANDATION', budgetMin: 500000, budgetMax: 600000, typologieRecherchee: 'Plusieurs lots (investissement)', financement: 'Pret bancaire 85%' },
  ] as const

  const checklistByIndex: Record<number, { mandatSigned: boolean; mandatSignedDate?: Date; financingProofUploaded: boolean; financingProofDate?: Date }> = {
    0: { mandatSigned: true, mandatSignedDate: new Date(Date.now() - 4 * 86400000), financingProofUploaded: false },
    2: { mandatSigned: true, mandatSignedDate: new Date(Date.now() - 20 * 86400000), financingProofUploaded: true, financingProofDate: new Date(Date.now() - 6 * 86400000) },
    9: { mandatSigned: true, mandatSignedDate: new Date(Date.now() - 30 * 86400000), financingProofUploaded: true, financingProofDate: new Date(Date.now() - 25 * 86400000) },
  }

  const contacts = []
  for (const c of contactsData) {
    const contact = await prisma.contact.create({
      data: { ...c, ownerId: [admin.id, manager.id, collab.id][contacts.length % 3], ...checklistByIndex[contacts.length] },
    })
    contacts.push(contact)
  }

  console.log('Creation des documents archives et commentaires...')
  await prisma.prospectDocument.createMany({
    data: [
      { contactId: contacts[0].id, name: 'Plans T3 Lyon 8e', type: 'PLANS', filePath: '/uploads/.gitkeep', uploadedById: admin.id },
      { contactId: contacts[2].id, name: 'Mandat de vente signe', type: 'MANDAT', filePath: '/uploads/.gitkeep', uploadedById: manager.id },
      { contactId: contacts[2].id, name: 'Attestation de financement BNP', type: 'ATTESTATION_FINANCEMENT', filePath: '/uploads/.gitkeep', uploadedById: manager.id },
      { contactId: contacts[9].id, name: 'Mandat de vente signe', type: 'MANDAT', filePath: '/uploads/.gitkeep', uploadedById: admin.id },
    ],
  })
  await prisma.comment.createMany({
    data: [
      { contactId: contacts[0].id, userId: admin.id, body: 'Tres interessee, a rappeler des que le T3 du 4e est disponible.' },
      { contactId: contacts[3].id, userId: collab.id, body: 'Investisseur serieux, cherche a diversifier sur 2-3 lots.' },
      { contactId: contacts[9].id, userId: manager.id, body: 'Dossier pret, en attente de la signature notaire.' },
    ],
  })
  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts[0].id, tagId: tagPrimoAccedant.id },
      { contactId: contacts[3].id, tagId: tagInvestisseur.id },
      { contactId: contacts[2].id, tagId: tagVip.id },
      { contactId: contacts[9].id, tagId: tagInvestisseur.id },
    ],
  })

  console.log('Creation des interactions...')
  await prisma.interaction.createMany({
    data: [
      { contactId: contacts[0].id, userId: admin.id, type: 'APPEL', subject: 'Premier contact', content: 'Interessee par un T3, budget 280k EUR', occurredAt: new Date(Date.now() - 5 * 86400000) },
      { contactId: contacts[0].id, userId: admin.id, type: 'EMAIL', subject: 'Envoi de biens correspondants', content: 'Selection envoyee selon criteres', occurredAt: new Date(Date.now() - 3 * 86400000) },
      { contactId: contacts[2].id, userId: manager.id, type: 'REUNION', subject: 'Point projet', content: 'RDV de suivi de dossier', occurredAt: new Date(Date.now() - 10 * 86400000) },
      { contactId: contacts[3].id, userId: collab.id, type: 'APPEL', subject: 'Suivi investissement locatif', content: 'Interesse par plusieurs lots pour defiscalisation', occurredAt: new Date(Date.now() - 2 * 86400000) },
    ],
  })

  console.log('Creation du pipeline commercial (opportunites)...')
  const oppStages = [
    'PROSPECT',
    'QUALIFICATION',
    'VISITE',
    'OFFRE',
    'NEGOCIATION',
    'FINANCEMENT',
    'PROMESSE',
    'COMPROMIS',
    'FERME_GAGNE',
    'FERME_PERDU',
  ] as const
  for (let i = 0; i < contacts.length; i++) {
    const stage = oppStages[i % oppStages.length]
    const opp = await prisma.opportunity.create({
      data: {
        title: `Projet ${contacts[i].firstName} ${contacts[i].lastName}`,
        contactId: contacts[i].id,
        amount: 150000 + i * 25000,
        probability: stage === 'FERME_GAGNE' ? 100 : stage === 'FERME_PERDU' ? 0 : 40 + i * 5,
        stage,
        ownerId: [admin.id, manager.id, collab.id][i % 3],
        closedAt: stage === 'FERME_GAGNE' || stage === 'FERME_PERDU' ? new Date() : null,
        expectedCloseDate: new Date(Date.now() + 30 * 86400000),
      },
    })
    await prisma.opportunityHistory.create({ data: { opportunityId: opp.id, toStage: stage } })
  }

  console.log('Creation des relances...')
  await prisma.relance.createMany({
    data: [
      { contactId: contacts[1].id, type: 'RELANCE_PROSPECT', dueDate: new Date(), assignedToId: admin.id, note: 'Relancer suite a la premiere prise de contact' },
      { contactId: contacts[3].id, type: 'RELANCE_DEVIS', dueDate: new Date(Date.now() + 86400000), assignedToId: collab.id, note: 'Devis envoye il y a 5 jours, sans reponse' },
      { contactId: contacts[7].id, type: 'RELANCE_PROSPECT', dueDate: new Date(Date.now() - 86400000), assignedToId: manager.id, note: 'Prospect froid, derniere relance il y a 3 semaines' },
      { contactId: contacts[8].id, type: 'SUIVI_PROJET', dueDate: new Date(Date.now() + 2 * 86400000), assignedToId: admin.id, note: 'Verifier satisfaction client' },
    ],
  })

  console.log('Creation des factures (suivi manuel)...')
  const facturePayee = await prisma.facture.create({
    data: {
      number: await generateFactureNumber(),
      promoterName: 'Urbanys Promotion',
      reference: 'FAC-PROMOTEUR-0118',
      contactId: contacts[2].id,
      status: 'PAYEE',
      dueDate: new Date(Date.now() - 10 * 86400000),
      createdById: manager.id,
      items: { create: [{ description: 'Honoraires accompagnement vente', quantity: 1, unitPrice: 3600, vatRate: 0 }] },
    },
  })
  await prisma.paiement.create({ data: { factureId: facturePayee.id, amount: 3600, method: 'VIREMENT', date: new Date(Date.now() - 8 * 86400000) } })

  await prisma.facture.create({
    data: {
      number: await generateFactureNumber(),
      promoterName: 'Groupe Cardinal',
      reference: 'FAC-PROMOTEUR-0119',
      contactId: contacts[6].id,
      status: 'IMPAYEE',
      dueDate: new Date(Date.now() - 15 * 86400000),
      createdById: admin.id,
      items: { create: [{ description: 'Frais de dossier', quantity: 1, unitPrice: 800, vatRate: 0 }] },
    },
  })

  await prisma.facture.create({
    data: {
      number: await generateFactureNumber(),
      promoterName: 'Urbanys Promotion',
      reference: 'FAC-PROMOTEUR-0120',
      contactId: contacts[9].id,
      status: 'ENVOYEE',
      dueDate: new Date(Date.now() + 20 * 86400000),
      createdById: admin.id,
      items: { create: [{ description: 'Commission mandataire', quantity: 1, unitPrice: 12500, vatRate: 0 }] },
    },
  })

  console.log('Creation des depenses...')
  await prisma.depense.createMany({
    data: [
      { category: 'MARKETING', amount: 450, description: 'Campagne publicitaire reseaux sociaux', createdById: admin.id, date: new Date(Date.now() - 20 * 86400000) },
      { category: 'TRANSPORT', amount: 120, description: 'Deplacement visite client', createdById: collab.id, date: new Date(Date.now() - 5 * 86400000) },
      { category: 'FOURNITURES', amount: 85, description: 'Materiel de bureau', createdById: manager.id, date: new Date(Date.now() - 12 * 86400000) },
      { category: 'LOYER', amount: 950, description: 'Loyer bureau mensuel', createdById: admin.id, date: new Date(Date.now() - 1 * 86400000) },
    ],
  })

  console.log('Creation des taches...')
  await prisma.task.createMany({
    data: [
      { title: 'Preparer dossier de financement', dueDate: new Date(Date.now() + 2 * 86400000), priority: 'HAUTE', status: 'EN_COURS', assignedToId: admin.id, createdById: admin.id, contactId: contacts[0].id },
      { title: 'Relancer le promoteur sur les disponibilites', dueDate: new Date(Date.now() + 86400000), priority: 'MOYENNE', status: 'A_FAIRE', assignedToId: manager.id, createdById: manager.id },
      { title: 'Envoyer compte-rendu hebdomadaire', dueDate: new Date(Date.now() + 5 * 86400000), priority: 'BASSE', status: 'A_FAIRE', assignedToId: collab.id, createdById: admin.id, recurrence: 'WEEKLY' },
    ],
  })

  console.log('Creation des rendez-vous...')
  await prisma.appointment.createMany({
    data: [
      { title: 'Visite appartement avec Marie Dupont', type: 'RDV_PHYSIQUE', startAt: new Date(Date.now() + 2 * 3600000), endAt: new Date(Date.now() + 3 * 3600000), location: 'Lyon 8e', contactId: contacts[0].id, createdById: admin.id },
      { title: 'Point telephonique financement', type: 'APPEL', startAt: new Date(Date.now() + 26 * 3600000), endAt: new Date(Date.now() + 27 * 3600000), contactId: contacts[3].id, createdById: collab.id },
      { title: 'Visio presentation de biens', type: 'VISIO', startAt: new Date(Date.now() + 48 * 3600000), endAt: new Date(Date.now() + 49 * 3600000), contactId: contacts[9].id, createdById: manager.id },
    ],
  })

  console.log('Seed termine avec succes.')
  console.log('Comptes de demo : admin@vefalys.fr / manager@vefalys.fr / collab@vefalys.fr - mot de passe : password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
