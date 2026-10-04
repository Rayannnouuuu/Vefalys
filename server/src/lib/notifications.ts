import { prisma } from './prisma'
import type { Server } from 'socket.io'

let io: Server | null = null
export function attachSocketServer(server: Server) {
  io = server
}

export async function createNotification(userId: string, type: string, title: string, message?: string, link?: string) {
  const notification = await prisma.notification.create({ data: { userId, type, title, message, link } })
  io?.to(`user:${userId}`).emit('notification', notification)
  return notification
}
