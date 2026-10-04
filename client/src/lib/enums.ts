// Valeurs + libelles FR, miroir de server/src/lib/enums.ts

export const CONTACT_STATUSES = [
  { value: 'PROSPECT_CHAUD', label: 'Prospect chaud', color: '#dc2626' },
  { value: 'PROSPECT_FROID', label: 'Prospect froid', color: '#2563eb' },
  { value: 'PROSPECT_RELANCE', label: 'Prospect relance', color: '#d97706' },
  { value: 'CLIENT_ACTIF', label: 'Client actif', color: '#16a34a' },
  { value: 'CLIENT_INACTIF', label: 'Client inactif', color: '#64748b' },
  { value: 'PERDU', label: 'Perdu', color: '#991b1b' },
]

export const CONTACT_SOURCES = [
  { value: 'DIRECT', label: 'Direct' },
  { value: 'RECOMMANDATION', label: 'Recommandation' },
  { value: 'SITE_WEB', label: 'Site web' },
  { value: 'RESEAUX_SOCIAUX', label: 'Reseaux sociaux' },
  { value: 'SALON', label: 'Salon' },
  { value: 'AUTRE', label: 'Autre' },
]

export const INTERACTION_TYPES = [
  { value: 'APPEL', label: 'Appel' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REUNION', label: 'Reunion' },
  { value: 'MESSAGE', label: 'Message' },
  { value: 'NOTE', label: 'Note' },
]

// Pipeline specifique VEFA : du premier contact jusqu'a la signature de l'acte.
export const OPPORTUNITY_STAGES = [
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'QUALIFICATION', label: 'Qualification' },
  { value: 'VISITE', label: 'Visite' },
  { value: 'OFFRE', label: 'Offre' },
  { value: 'NEGOCIATION', label: 'Negociation' },
  { value: 'FINANCEMENT', label: 'Financement' },
  { value: 'PROMESSE', label: 'Promesse de vente' },
  { value: 'COMPROMIS', label: 'Compromis' },
  { value: 'FERME_GAGNE', label: 'Acte signe' },
  { value: 'FERME_PERDU', label: 'Perdu' },
]

export const RELANCE_TYPES = [
  { value: 'RELANCE_PROSPECT', label: 'Relance prospect' },
  { value: 'RELANCE_DEVIS', label: 'Relance devis' },
  { value: 'SUIVI_PROJET', label: 'Suivi de projet' },
  { value: 'COMMANDE_RECURRENTE', label: 'Commande recurrente' },
  { value: 'AUTRE', label: 'Autre' },
]

export const PROSPECT_DOCUMENT_TYPES = [
  { value: 'MANDAT', label: 'Mandat de vente' },
  { value: 'PLANS', label: 'Plans du bien' },
  { value: 'ATTESTATION_FINANCEMENT', label: 'Attestation de financement' },
  { value: 'AUTRE', label: 'Autre' },
]

export const FACTURE_STATUSES = [
  { value: 'BROUILLON', label: 'Brouillon', color: '#64748b' },
  { value: 'ENVOYEE', label: 'Envoyee', color: '#2563eb' },
  { value: 'PAYEE', label: 'Payee', color: '#16a34a' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payee', color: '#d97706' },
  { value: 'IMPAYEE', label: 'Impayee', color: '#dc2626' },
  { value: 'ANNULEE', label: 'Annulee', color: '#64748b' },
]

export const PAIEMENT_METHODS = [
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ESPECES', label: 'Especes' },
  { value: 'CB', label: 'Carte bancaire' },
  { value: 'AUTRE', label: 'Autre' },
]

export const DEPENSE_CATEGORIES = [
  { value: 'FOURNITURES', label: 'Fournitures' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'PRESTATION', label: 'Prestation' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'AUTRE', label: 'Autre' },
]

export const TASK_PRIORITIES = [
  { value: 'BASSE', label: 'Basse', color: '#64748b' },
  { value: 'MOYENNE', label: 'Moyenne', color: '#2563eb' },
  { value: 'HAUTE', label: 'Haute', color: '#d97706' },
  { value: 'URGENTE', label: 'Urgente', color: '#dc2626' },
]

export const TASK_RECURRENCES = ['NONE', 'WEEKLY', 'MONTHLY']

export const TASK_STATUSES = [
  { value: 'A_FAIRE', label: 'A faire' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminee' },
  { value: 'BLOQUEE', label: 'Bloquee' },
]

export const APPOINTMENT_TYPES = [
  { value: 'APPEL', label: 'Appel' },
  { value: 'VISIO', label: 'Visio' },
  { value: 'RDV_PHYSIQUE', label: 'RDV physique' },
]

export function labelFor(list: { value: string; label: string }[], value: string): string {
  return list.find((i) => i.value === value)?.label || value
}
export function colorFor(list: { value: string; color?: string }[], value: string): string {
  return list.find((i) => i.value === value)?.color || '#64748b'
}
