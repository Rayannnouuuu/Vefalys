export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'COLLABORATEUR'
  avatarColor: string
  isActive?: boolean
  emailVerified?: boolean
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt?: string | null
  approvedBy?: { id: string; firstName: string; lastName: string } | null
  createdAt?: string
}

export interface Permission {
  key: string
  label: string
  enabled: boolean
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  company?: string | null
  sector?: string | null
  location?: string | null
  status: string
  source: string
  notes?: string | null
  score: number
  budgetMin?: number | null
  budgetMax?: number | null
  typologieRecherchee?: string | null
  localisationSouhaitee?: string | null
  financement?: string | null
  criteresNotes?: string | null
  mandatSigned: boolean
  mandatSignedDate?: string | null
  financingProofUploaded: boolean
  financingProofDate?: string | null
  ownerId?: string | null
  owner?: { id: string; firstName: string; lastName: string } | null
  tags: { tag: Tag }[]
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
  interactions?: Interaction[]
  opportunities?: Opportunity[]
  relances?: Relance[]
  tasks?: any[]
  appointments?: any[]
  factures?: any[]
  documents?: ProspectDocument[]
  comments?: Comment[]
  simulations?: FinancialSimulation[]
}

export interface FinancialSimulation {
  id: string
  contactId?: string | null
  contact?: { id: string; firstName: string; lastName: string } | null
  label?: string | null
  objectif: string
  typeBien: string
  primoAccedant: boolean
  revenusMensuels: number
  chargesMensuelles: number
  apport: number
  dureeAnnees: number
  tauxPersonnalise?: number | null
  personnesFoyer: number
  zone: string
  revenuFiscalReference?: number | null
  prixBienVise?: number | null
  tauxApplique: number
  mensualiteMax: number
  capaciteEmprunt: number
  fraisNotaire: number
  coutInterets: number
  tauxEndettement: number
  budgetFinancable: number
  ptzEligible: boolean
  ptzMontant?: number | null
  ptzMotifInegibilite?: string | null
  budgetTotalAvecPtz?: number | null
  cibleMensualite?: number | null
  cibleMargeMensuelle?: number | null
  cibleApportSupplementaire?: number | null
  createdBy?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}

export interface ProspectDocument {
  id: string
  contactId: string
  name: string
  type: string
  filePath: string
  uploadedAt: string
  uploadedBy?: { firstName: string; lastName: string } | null
}

export interface Comment {
  id: string
  contactId: string
  userId?: string | null
  user?: { id: string; firstName: string; lastName: string; avatarColor: string } | null
  body: string
  createdAt: string
}

export interface Interaction {
  id: string
  contactId: string
  userId?: string | null
  user?: { firstName: string; lastName: string } | null
  type: string
  subject?: string | null
  content?: string | null
  occurredAt: string
}

export interface Opportunity {
  id: string
  title: string
  contactId: string
  contact?: { id: string; firstName: string; lastName: string; company?: string | null }
  amount: number
  probability: number
  expectedCloseDate?: string | null
  stage: string
  description?: string | null
  lostReason?: string | null
  ownerId?: string | null
  owner?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
  updatedAt: string
  closedAt?: string | null
}

export interface Relance {
  id: string
  contactId?: string | null
  contact?: { id: string; firstName: string; lastName: string; company?: string | null } | null
  opportunityId?: string | null
  opportunity?: { id: string; title: string } | null
  type: string
  dueDate: string
  status: string
  note?: string | null
  assignedToId?: string | null
  assignedTo?: { id: string; firstName: string; lastName: string } | null
}

export interface FactureItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface Paiement {
  id: string
  factureId: string
  amount: number
  date: string
  method: string
  note?: string | null
}

export interface Facture {
  id: string
  number: string
  promoterName?: string | null
  reference?: string | null
  attachmentPath?: string | null
  contactId: string
  contact?: { id: string; firstName: string; lastName: string; company?: string | null }
  status: string
  issueDate: string
  dueDate?: string | null
  notes?: string | null
  isAvoir: boolean
  items: FactureItem[]
  paiements: Paiement[]
  totalHT: number
  totalTTC: number
  paid: number
  remaining: number
}

export interface Depense {
  id: string
  category: string
  amount: number
  date: string
  description?: string | null
  accountingCode?: string | null
  receiptPath?: string | null
}

export interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority: string
  status: string
  assignedToId?: string | null
  assignedTo?: { id: string; firstName: string; lastName: string } | null
  contactId?: string | null
  contact?: { id: string; firstName: string; lastName: string } | null
  opportunityId?: string | null
  opportunity?: { id: string; title: string } | null
  recurrence: string
}

export interface Appointment {
  id: string
  title: string
  type: string
  startAt: string
  endAt: string
  location?: string | null
  description?: string | null
  contactId?: string | null
  contact?: { id: string; firstName: string; lastName: string } | null
  source: string
  createdBy?: { id: string; firstName: string; lastName: string; avatarColor: string } | null
}

export interface Notification {
  id: string
  type: string
  title: string
  message?: string | null
  link?: string | null
  read: boolean
  createdAt: string
}
