// Generation de projets de documents immobiliers VEFA pre-remplis.
// IMPORTANT : ce sont des PROJETS a faire valider par un professionnel du droit (notaire / juriste)
// avant toute signature. La reglementation VEFA (Loi Hoguet, carte T, mentions obligatoires du
// Code de la construction et de l'habitation) impose des clauses qui doivent etre verifiees au cas par cas.

interface TemplateData {
  contact: { firstName: string; lastName: string; email?: string | null; phone?: string | null; location?: string | null }
  program: { name: string; promoterName: string; address: string; city: string; postalCode?: string | null; deliveryDate?: Date | null }
  unit?: { reference: string; typology: string; floor?: number | null; surface?: number | null; price?: number | null } | null
  offerPrice?: number | null
  financingCondition?: string | null
  companyName?: string
}

const DISCLAIMER = `<p style="background:#fef3c7;border:1px solid #f59e0b;padding:8px;border-radius:6px;font-size:12px;color:#92400e;">
  Document genere automatiquement a titre de PROJET. A faire valider par un professionnel du droit (notaire, juriste)
  avant toute signature. Ne constitue pas un acte juridiquement valide en l'etat.
</p>`

function fmtDate(d?: Date | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : 'A definir'
}
function fmtPrice(p?: number | null) {
  return p != null ? `${p.toLocaleString('fr-FR')} EUR` : 'A definir'
}

export function generateMandatVente(data: TemplateData): string {
  const { contact, program, companyName = 'Mandataire Immobilier' } = data
  return `
  ${DISCLAIMER}
  <h2>Mandat de Recherche / Vente</h2>
  <p><strong>Entre les soussignes :</strong></p>
  <p>${companyName}, mandataire en transactions immobilieres, agissant pour le compte du promoteur <strong>${program.promoterName}</strong></p>
  <p>Et : <strong>${contact.firstName} ${contact.lastName}</strong>${contact.email ? `, email : ${contact.email}` : ''}${contact.phone ? `, tel : ${contact.phone}` : ''}</p>
  <p><strong>Objet du mandat :</strong> Programme immobilier neuf en VEFA (Vente en Etat Futur d'Achevement) "${program.name}", situe ${program.address}, ${program.postalCode || ''} ${program.city}.</p>
  <p>Date de livraison previsionnelle : ${fmtDate(program.deliveryDate)}</p>
  <p>Fait le ${fmtDate(new Date())}</p>
  <p>Signature du mandataire _____________________ &nbsp;&nbsp;&nbsp; Signature du client _____________________</p>
  `
}

export function generateOffreAchat(data: TemplateData): string {
  const { contact, program, unit, offerPrice, financingCondition } = data
  return `
  ${DISCLAIMER}
  <h2>Offre d'Achat - VEFA</h2>
  <p><strong>Acquereur potentiel :</strong> ${contact.firstName} ${contact.lastName}</p>
  <p><strong>Programme :</strong> ${program.name} - ${program.address}, ${program.city}</p>
  <p><strong>Bien concerne :</strong> ${unit ? `Lot ${unit.reference} - ${unit.typology}${unit.surface ? ` (${unit.surface} m2)` : ''}${unit.floor != null ? `, etage ${unit.floor}` : ''}` : 'A preciser'}</p>
  <p><strong>Prix propose :</strong> ${fmtPrice(offerPrice ?? unit?.price)}</p>
  <p><strong>Condition de financement :</strong> ${financingCondition || 'A preciser (pret bancaire, apport, PTZ...)'}</p>
  <p>Cette offre est soumise a l'acceptation du promoteur <strong>${program.promoterName}</strong> et a l'obtention du financement par l'acquereur.</p>
  <p>Fait le ${fmtDate(new Date())}</p>
  <p>Signature de l'acquereur _____________________</p>
  `
}

export function generateCompromisVente(data: TemplateData): string {
  const { contact, program, unit, offerPrice } = data
  return `
  ${DISCLAIMER}
  <h2>Compromis / Contrat Preliminaire de Reservation - VEFA</h2>
  <p><strong>Entre le promoteur :</strong> ${program.promoterName}</p>
  <p><strong>Et le reservataire :</strong> ${contact.firstName} ${contact.lastName}</p>
  <p><strong>Designation du bien reserve :</strong> Lot ${unit?.reference || 'A preciser'}, typologie ${unit?.typology || ''}${unit?.surface ? `, ${unit.surface} m2` : ''}, au sein du programme "${program.name}" sis ${program.address}, ${program.postalCode || ''} ${program.city}.</p>
  <p><strong>Prix de vente convenu :</strong> ${fmtPrice(offerPrice ?? unit?.price)}</p>
  <p><strong>Date de livraison previsionnelle :</strong> ${fmtDate(program.deliveryDate)}</p>
  <p>Conformement a l'article L. 261-15 du Code de la construction et de l'habitation, un depot de garantie pourra etre verse sur un compte special.</p>
  <p>Fait le ${fmtDate(new Date())}, en deux exemplaires originaux.</p>
  <p>Signature du promoteur _____________________ &nbsp;&nbsp;&nbsp; Signature du reservataire _____________________</p>
  `
}

export function generateFactureCommissionNote(data: TemplateData & { commissionAmount: number; commissionType: string }): string {
  return `
  <h2>Note relative a la commission de mandataire</h2>
  <p>Programme : ${data.program.name}</p>
  <p>Client : ${data.contact.firstName} ${data.contact.lastName}</p>
  <p>Etape : ${data.commissionType}</p>
  <p>Montant de la commission : ${fmtPrice(data.commissionAmount)}</p>
  `
}
