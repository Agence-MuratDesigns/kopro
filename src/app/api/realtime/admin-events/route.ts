export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminConnections } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  // Verify user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || !['ADMIN'].includes(user.role)) {
    return new Response('Unauthorized', { status: 403 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Add this connection to admin connections
      adminConnections.add(controller)

      // Send initial counts
      try {
        const [pendingMpr, pendingMandate, pendingQuotes, pendingInvoices, unreadMessages] = await Promise.all([
          prisma.dossier.count({ where: { mprStatus: 'PENDING_REVIEW' } }),
          prisma.dossierStep.count({
            where: {
              template: { code: 'MANDATE_SIGNATURE' },
              status: 'PENDING_VALIDATION',
            },
          }),
          prisma.dossierStep.count({
            where: {
              template: { code: 'QUOTE_DEPOSIT' },
              status: 'PENDING_VALIDATION',
            },
          }),
          prisma.dossierStep.count({
            where: {
              template: { code: 'INVOICE_DEPOSIT' },
              status: 'PENDING_VALIDATION',
            },
          }),
          prisma.message.count({
            where: { isRead: false, messageType: 'CLIENT' },
          }),
        ])

        const initialData = JSON.stringify({
          type: 'admin_counts',
          payload: {
            pendingValidations: pendingMpr + pendingMandate + pendingQuotes + pendingInvoices,
            pendingMpr,
            pendingMandate,
            pendingQuotes,
            pendingInvoices,
            unreadMessages,
          },
        })
        controller.enqueue(`data: ${initialData}\n\n`)
      } catch (error) {
        console.error('[Admin SSE] Error fetching initial counts:', error)
      }

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`)
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        adminConnections.delete(controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
