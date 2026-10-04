// Calculs du simulateur de financement, portes depuis le simulateur public
// vefalys.fr/assets/js/simulateur.js (meme entreprise, meme methode de calcul) pour que les
// chiffres donnes aux prospects dans le CRM correspondent a ceux du site vitrine.
//
// Taux indicatifs hors assurance et hors frais (milieu des fourchettes de marche, voir le site
// pour la mise a jour mensuelle). Frais de notaire et plafond d'endettement HCSF a 35%.
const RATES: Record<number, number> = { 15: 3.33, 20: 3.47, 25: 3.56 }
export const RATES_MOIS = 'septembre 2026'
const NOTARY = { neuf: 0.025, ancien: 0.075 }
const MAX_DEBT_RATIO = 0.35
const TAUX_MIN = 0.1
const TAUX_MAX = 10

// Bareme du pret a taux zero (PTZ) - source economie.gouv.fr, decret 2025-299, articles du code
// de la construction et de l'habitation cites ci-dessous. A revalider a chaque revision du
// dispositif (en vigueur jusqu'au 31 decembre 2027).
const PTZ = {
  // Plafonds de l'operation, art. D31-10-10. La derniere ligne couvre 5 personnes et plus.
  plafondOperation: {
    1: { A: 150000, B1: 135000, B2: 110000, C: 100000 },
    2: { A: 225000, B1: 202500, B2: 165000, C: 150000 },
    3: { A: 270000, B1: 243000, B2: 198000, C: 180000 },
    4: { A: 315000, B1: 283500, B2: 231000, C: 210000 },
    5: { A: 360000, B1: 324000, B2: 264000, C: 240000 },
  } as Record<number, Record<string, number>>,
  // Plafonds de ressources donnant acces au dispositif, art. D31-10-3-1.
  plafondRessources: {
    1: { A: 49000, B1: 34500, B2: 31500, C: 28500 },
    2: { A: 73500, B1: 51750, B2: 47250, C: 42750 },
    3: { A: 88200, B1: 62100, B2: 56700, C: 51300 },
    4: { A: 102900, B1: 72450, B2: 66150, C: 59850 },
    5: { A: 117600, B1: 82800, B2: 75600, C: 68400 },
    6: { A: 132300, B1: 93150, B2: 85050, C: 76950 },
    7: { A: 147000, B1: 103500, B2: 94500, C: 85500 },
    8: { A: 161700, B1: 113850, B2: 103950, C: 94050 },
  } as Record<number, Record<string, number>>,
  // Coefficient familial, deduit des plafonds de ressources ci-dessus.
  coefficient: { 1: 1, 2: 1.5, 3: 1.8, 4: 2.1, 5: 2.4, 6: 2.7, 7: 3, 8: 3.3 } as Record<number, number>,
  // Tranches de ressources, art. D31-10-9, appliquees au revenu par personne.
  tranches: [
    { A: 25000, B1: 21500, B2: 18000, C: 15000 },
    { A: 31000, B1: 26000, B2: 22500, C: 19500 },
    { A: 37000, B1: 30000, B2: 27000, C: 24000 },
    { A: 49000, B1: 34500, B2: 31500, C: 28500 },
  ] as Record<string, number>[],
  // Quotites, art. D31-10-9. La maison individuelle neuve est moins bien dotee.
  quotite: {
    collectif: [0.5, 0.4, 0.4, 0.2],
    individuel: [0.3, 0.2, 0.2, 0.1],
  },
}

export interface SimulationInput {
  objectif: 'PRINCIPALE' | 'LOCATIF' | 'SECONDAIRE'
  typeBien: 'APPARTEMENT_NEUF' | 'MAISON_NEUVE' | 'APPARTEMENT_ANCIEN' | 'MAISON_ANCIENNE'
  primoAccedant: boolean
  revenusMensuels: number
  chargesMensuelles: number
  apport: number
  dureeAnnees: number
  tauxPersonnalise?: number | null
  personnesFoyer: number
  zone: 'A' | 'B1' | 'B2' | 'C'
  revenuFiscalReference?: number | null
  prixBienVise?: number | null
}

export interface SimulationResult {
  tauxApplique: number
  mensualiteMax: number
  capaciteEmprunt: number
  fraisNotaire: number
  coutInterets: number
  tauxEndettement: number
  budgetFinancable: number
  ptzEligible: boolean
  ptzMontant: number | null
  ptzMotifInegibilite: string | null
  ptzTranche: number | null
  ptzQuotite: number | null
  ptzPlafondOperation: number | null
  ptzPlafondRessources: number | null
  budgetTotalAvecPtz: number | null
  cibleMensualite: number | null
  cibleMargeMensuelle: number | null
  cibleApportSupplementaire: number | null
}

function isNeuf(typeBien: SimulationInput['typeBien']) {
  return typeBien === 'APPARTEMENT_NEUF' || typeBien === 'MAISON_NEUVE'
}

function ptzPossible(input: SimulationInput) {
  return input.objectif === 'PRINCIPALE' && input.primoAccedant && isNeuf(input.typeBien)
}

function tauxRetenu(duree: number, tauxPersonnalise?: number | null) {
  const saisi = tauxPersonnalise != null && tauxPersonnalise >= TAUX_MIN && tauxPersonnalise <= TAUX_MAX
  return saisi ? tauxPersonnalise! : RATES[duree] ?? 3.5
}

// Capital emprunte financable pour une mensualite donnee (mensualite -> capital).
function loanCapacity(monthly: number, annualRate: number, years: number) {
  const i = annualRate / 100 / 12
  const n = years * 12
  return monthly * (1 - Math.pow(1 + i, -n)) / i
}

// Mensualite necessaire pour un capital donne (capital -> mensualite), inverse de loanCapacity.
function monthlyFor(capital: number, annualRate: number, years: number) {
  if (capital <= 0) return 0
  const i = annualRate / 100 / 12
  const n = years * 12
  return (capital * i) / (1 - Math.pow(1 + i, -n))
}

function estimatePtz(opts: { personnes: number; zone: string; revenuAnnuel: number; prix: number; autresPrets: number; collectif: boolean }) {
  const pers = Math.min(Math.max(opts.personnes, 1), 8)
  const plafondRessources = PTZ.plafondRessources[pers][opts.zone]
  if (opts.revenuAnnuel > plafondRessources) {
    return { eligible: false as const, motif: 'ressources', plafondRessources, personnes: pers }
  }
  const revenuParPersonne = opts.revenuAnnuel / PTZ.coefficient[pers]
  let tranche = -1
  for (let i = 0; i < PTZ.tranches.length; i++) {
    if (revenuParPersonne <= PTZ.tranches[i][opts.zone]) {
      tranche = i
      break
    }
  }
  if (tranche === -1) {
    return { eligible: false as const, motif: 'ressources', plafondRessources, personnes: pers }
  }
  const plafondOperation = PTZ.plafondOperation[Math.min(pers, 5)][opts.zone]
  const base = Math.min(opts.prix, plafondOperation)
  const quotite = PTZ.quotite[opts.collectif ? 'collectif' : 'individuel'][tranche]
  // Art. D31-10-6 : le PTZ ne peut pas depasser le montant des autres prets.
  return {
    eligible: true as const,
    montant: Math.min(base * quotite, opts.autresPrets),
    tranche: tranche + 1,
    quotite,
    plafondOperation,
    base,
  }
}

export function computeSimulation(input: SimulationInput): SimulationResult {
  const revenus = input.revenusMensuels || 0
  const charges = input.chargesMensuelles || 0
  const apport = input.apport || 0
  const duree = input.dureeAnnees || 20
  const rate = tauxRetenu(duree, input.tauxPersonnalise)
  const neuf = isNeuf(input.typeBien)

  // Regle HCSF : l'ensemble des charges de credit reste sous 35% des revenus.
  const mensualiteMax = Math.max(revenus * MAX_DEBT_RATIO - charges, 0)
  const capacite = mensualiteMax > 0 ? loanCapacity(mensualiteMax, rate, duree) : 0

  const notaryRate = neuf ? NOTARY.neuf : NOTARY.ancien
  const enveloppe = capacite + apport
  const prixBien = enveloppe / (1 + notaryRate)
  const fraisNotaire = prixBien * notaryRate

  const rfrSaisi = !!input.revenuFiscalReference && input.revenuFiscalReference > 0
  const revenuPtz = rfrSaisi ? input.revenuFiscalReference! : revenus * 12

  const possible = ptzPossible(input)
  const collectif = input.typeBien === 'APPARTEMENT_NEUF'
  const ptz = possible
    ? estimatePtz({ personnes: input.personnesFoyer, zone: input.zone, revenuAnnuel: revenuPtz, prix: prixBien, autresPrets: capacite, collectif })
    : ({ eligible: false as const, motif: 'situation' } as const)

  const coutInterets = mensualiteMax * duree * 12 - capacite
  const endettement = revenus > 0 ? ((mensualiteMax + charges) / revenus) * 100 : 0

  const result: SimulationResult = {
    tauxApplique: rate,
    mensualiteMax,
    capaciteEmprunt: capacite,
    fraisNotaire,
    coutInterets,
    tauxEndettement: endettement,
    budgetFinancable: prixBien,
    ptzEligible: ptz.eligible,
    ptzMontant: ptz.eligible ? ptz.montant : null,
    ptzMotifInegibilite: ptz.eligible ? null : ptz.motif,
    ptzTranche: ptz.eligible ? ptz.tranche : null,
    ptzQuotite: ptz.eligible ? ptz.quotite : null,
    ptzPlafondOperation: ptz.eligible ? ptz.plafondOperation : null,
    ptzPlafondRessources: !ptz.eligible && ptz.motif === 'ressources' ? ptz.plafondRessources : null,
    budgetTotalAvecPtz: ptz.eligible ? prixBien + ptz.montant : null,
    cibleMensualite: null,
    cibleMargeMensuelle: null,
    cibleApportSupplementaire: null,
  }

  // Bien deja repere : confronte sa mensualite reelle au plafond disponible. Le PTZ, sans
  // interets, est lisse ici sur la meme duree que le pret principal pour simplifier ; un
  // differe de remboursement, frequent sur le PTZ, allegerait en pratique les premieres annees.
  const prixCible = input.prixBienVise || 0
  if (prixCible > 0 && mensualiteMax > 0) {
    const besoin = prixCible * (1 + notaryRate) - apport
    let ptzCible = 0
    if (possible && besoin > 0) {
      const estimCible = estimatePtz({ personnes: input.personnesFoyer, zone: input.zone, revenuAnnuel: revenuPtz, prix: prixCible, autresPrets: besoin / 2, collectif })
      if (estimCible.eligible) ptzCible = estimCible.montant
    }
    const capitalBanque = Math.max(besoin - ptzCible, 0)
    const cibleMensualite = monthlyFor(capitalBanque, rate, duree) + ptzCible / (duree * 12)
    const marge = mensualiteMax - cibleMensualite

    result.cibleMensualite = cibleMensualite
    if (marge >= 0) {
      result.cibleMargeMensuelle = marge
      result.cibleApportSupplementaire = null
    } else {
      result.cibleMargeMensuelle = marge
      const mensualiteBanqueMax = Math.max(mensualiteMax - ptzCible / (duree * 12), 0)
      const capitalBanqueMax = loanCapacity(mensualiteBanqueMax, rate, duree)
      result.cibleApportSupplementaire = Math.max(capitalBanque - capitalBanqueMax, 0)
    }
  }

  return result
}
