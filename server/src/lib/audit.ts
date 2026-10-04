import { prisma } from './prisma'

export async function logAudit(userId: string | undefined, action: string, entityType: string, entityId: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  }).catch((e) => console.error('audit log failed', e))
}
