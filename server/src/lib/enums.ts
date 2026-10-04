// Listes de valeurs autorisees pour les champs "statut/categorie" stockes en String.
// Utilise pour valider les entrees API (zod) et pour alimenter les menus deroulants du frontend.

export const ROLES = ['ADMIN', 'MANAGER', 'COLLABORATEUR'] as const

export const CONTACT_STATUSES = [
  'PROSPECT_CHAUD',
  'PROSPECT_FROID',
  'PROSPECT_RELANCE',
  'CLIENT_ACTIF',
  'CLIENT_INACTIF',
  'PERDU',
] as const

export const CONTACT_SOURCES = ['DIRECT', 'RECOMMANDATION', 'SITE_WEB', 'RESEAUX_SOCIAUX', 'SALON', 'AUTRE'] as const

export const INTERACTION_TYPES = ['APPEL', 'EMAIL', 'REUNION', 'MESSAGE', 'NOTE'] as const

// Pipeline specifique VEFA : du premier contact jusqu'a la signature de l'acte.
export const OPPORTUNITY_STAGES = [
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

export const RELANCE_TYPES = ['RELANCE_PROSPECT', 'RELANCE_DEVIS', 'SUIVI_PROJET', 'COMMANDE_RECURRENTE', 'AUTRE'] as const
export const RELANCE_STATUSES = ['A_FAIRE', 'FAITE', 'ANNULEE'] as const

export const PROGRAM_STATUSES = ['PROSPECTION', 'EN_VENTE', 'EN_CONSTRUCTION', 'LIVRE'] as const
export const UNIT_TYPOLOGIES = ['T1', 'T2', 'T3', 'T4', 'T5'] as const
export const UNIT_STATUSES = ['DISPONIBLE', 'RESERVE', 'VENDU'] as const
export const PROGRAM_DOCUMENT_TYPES = ['PLAN', 'FICHE_TECHNIQUE', 'DPE', 'PERMIS_CONSTRUIRE', 'AUTRE'] as const

export const PROSPECT_PROGRAM_STAGES = [
  'PROSPECTION',
  'VISITE',
  'OFFRE_PRELIMINAIRE',
  'DEMANDE_FINANCEMENT',
  'PROMESSE_VENTE',
  'COMPROMIS',
  'ACTE_SIGNE',
  'PERDU',
] as const

export const DOSSIER_PIECE_TYPES = [
  'PIECE_IDENTITE',
  'JUSTIFICATIF_REVENUS',
  'PREUVE_FINANCEMENT',
  'ASSURANCE_EMPRUNTEUR',
  'AUTRE',
] as const
export const DOSSIER_PIECE_STATUSES = ['MANQUANT', 'RECU', 'VALIDE'] as const

export const GENERATED_DOCUMENT_TYPES = ['MANDAT_VENTE', 'OFFRE_ACHAT', 'COMPROMIS_VENTE', 'FACTURE_COMMISSION'] as const

export const COMMISSION_TYPES = ['PROMESSE', 'COMPROMIS', 'ACTE'] as const
export const COMMISSION_STATUSES = ['A_PERCEVOIR', 'FACTUREE', 'PAYEE'] as const
// Taux par defaut appliques automatiquement quand un dossier VEFA change d'etape
export const COMMISSION_DEFAULT_RATES: Record<(typeof COMMISSION_TYPES)[number], number> = {
  PROMESSE: 3,
  COMPROMIS: 2,
  ACTE: 2,
}

export const DEVIS_STATUSES = ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REJETE', 'FACTURE'] as const
export const FACTURE_STATUSES = ['BROUILLON', 'ENVOYEE', 'PAYEE', 'PARTIELLEMENT_PAYEE', 'IMPAYEE', 'ANNULEE'] as const
export const PAIEMENT_METHODS = ['VIREMENT', 'CHEQUE', 'ESPECES', 'CB', 'AUTRE'] as const
export const DEPENSE_CATEGORIES = ['FOURNITURES', 'TRANSPORT', 'PRESTATION', 'LOYER', 'MARKETING', 'AUTRE'] as const

export const TASK_PRIORITIES = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] as const
export const TASK_STATUSES = ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'BLOQUEE'] as const
export const TASK_RECURRENCES = ['NONE', 'WEEKLY', 'MONTHLY'] as const

export const APPOINTMENT_TYPES = ['APPEL', 'VISIO', 'RDV_PHYSIQUE'] as const

export const NOTIFICATION_TYPES = ['RELANCE', 'FACTURE_IMPAYEE', 'RDV', 'OPPORTUNITE', 'SYSTEME', 'DOSSIER_INACTIF'] as const

export const PROSPECT_DOCUMENT_TYPES = ['MANDAT', 'PLANS', 'ATTESTATION_FINANCEMENT', 'AUTRE'] as const
