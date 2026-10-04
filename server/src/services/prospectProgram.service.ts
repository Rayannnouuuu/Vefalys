import { prisma } from '../lib/prisma'
import { COMMISSION_DEFAULT_RATES } from '../lib/enums'
import { createNotification } from '../lib/notifications'
import { generateFactureNumber } from '../lib/numbering'

const STAGE_TO_COMMISSION: Record<string, keyof typeof COMMISSION_DEFAULT_RATES | undefined> = {
  PROMESSE_VENTE: 'PROMESSE',
  COMPROMIS: 'COMPROMIS',
  ACTE_SIGNE: 'ACTE',
}

// Checklist standard de pieces a fournir, creee automatiquement a l'ouverture d'un dossier VEFA
const DEFAULT_DOSSIER_PIECES = ['PIECE_IDENTITE', 'JUSTIFICATIF_REVENUS', 'PREUVE_FINANCEMENT', 'ASSURANCE_EMPRUNTEUR']

export async function createDossierPiecesChecklist(prospectProgramId: string) {
  await prisma.dossierPiece.createMany({
    data: DEFAULT_DOSSIER_PIECES.map((type) => ({ prospectProgramId, type, status: 'MANQUANT' })),
  })
}

export async function handleStageTransition(
  prospectProgramId: string,
  fromStage: string | null,
  toStage: string,
  changedById?: string,
) {
  await prisma.prospectProgramHistory.create({
    data: { prospectProgramId, fromStage, toStage },
  })

  const commissionType = STAGE_TO_COMMISSION[toStage]
  if (commissionType) {
    const pp = await prisma.prospectProgram.findUnique({
      where: { id: prospectProgramId },
      include: { unit: true, contact: true, program: true },
    })
    if (pp) {
      const basePrice = pp.offerPrice ?? pp.unit?.price ?? 0
      const rate = COMMISSION_DEFAULT_RATES[commissionType]
      const amount = Math.round(basePrice * (rate / 100) * 100) / 100

      // La commission due au promoteur a chaque etape cle (promesse/compromis/acte) est
      // automatiquement facturee pour eviter toute manipulation manuelle (sync CRM <-> Compta).
      const factureNumber = await generateFactureNumber()
      const facture = await prisma.facture.create({
        data: {
          number: factureNumber,
          contactId: pp.contactId,
          prospectProgramId: pp.id,
          status: 'ENVOYEE',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: `Commission ${commissionType} - Programme ${pp.program.name} - ${pp.contact.firstName} ${pp.contact.lastName}`,
          items: {
            create: [
              {
                description: `Commission mandataire (${commissionType.toLowerCase()}) - ${rate}% - Programme ${pp.program.name}`,
                quantity: 1,
                unitPrice: amount,
                vatRate: 0,
              },
            ],
          },
        },
      })

      await prisma.commission.create({
        data: { prospectProgramId, type: commissionType, rate, amount, status: 'FACTUREE', factureId: facture.id },
      })

      if (pp.contact.ownerId) {
        await createNotification(
          pp.contact.ownerId,
          'OPPORTUNITE',
          `Commission ${commissionType.toLowerCase()} generee`,
          `${pp.contact.firstName} ${pp.contact.lastName} - ${pp.program.name} : ${amount.toLocaleString('fr-FR')} EUR`,
          `/programmes/${pp.programId}`,
        )
      }
    }
  }

  if (toStage === 'ACTE_SIGNE') {
    const pp = await prisma.prospectProgram.findUnique({ where: { id: prospectProgramId } })
    if (pp?.unitId) {
      await prisma.programUnit.update({ where: { id: pp.unitId }, data: { status: 'VENDU' } })
    }
    await prisma.prospectProgram.update({ where: { id: prospectProgramId }, data: { signedAt: new Date() } })
  } else if (toStage === 'PROMESSE_VENTE' || toStage === 'COMPROMIS') {
    const pp = await prisma.prospectProgram.findUnique({ where: { id: prospectProgramId } })
    if (pp?.unitId) {
      await prisma.programUnit.update({ where: { id: pp.unitId }, data: { status: 'RESERVE' } })
    }
  }
}
