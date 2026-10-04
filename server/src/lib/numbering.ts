import { prisma } from './prisma'

// Numerotation chronologique et sequentielle : DEV-2026-0001, FAC-2026-0001...
async function nextNumber(prefix: string, count: number): Promise<string> {
  const year = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}

export async function generateDevisNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.devis.count({ where: { number: { startsWith: `DEV-${year}-` } } })
  return nextNumber('DEV', count)
}

export async function generateFactureNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.facture.count({ where: { number: { startsWith: `FAC-${year}-` } } })
  return nextNumber('FAC', count)
}
