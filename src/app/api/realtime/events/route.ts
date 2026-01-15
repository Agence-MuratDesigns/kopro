import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { connections } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Add this connection to the user's set
      if (!connections.has(userId)) {
        connections.set(userId, new Set())
      }
      connections.get(userId)!.add(controller)

      // Send initial counts
      try {
        const [notifications, messages] = await Promise.all([
          prisma.notification.count({
            where: { userId, isRead: false },
          }),
          prisma.message.count({
            where: {
              dossier: { clientId: userId },
              isRead: false,
              messageType: { in: ['ADMIN', 'SYSTEM'] },
            },
          }),
        ])

        const initialData = JSON.stringify({
          type: 'counts',
          payload: { notifications, messages },
        })
        controller.enqueue(`data: ${initialData}\n\n`)
      } catch (error) {
        console.error('[SSE] Error fetching initial counts:', error)
      }

      // Send heartbeat every 30 seconds to keep connection alive
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
        const userConnections = connections.get(userId)
        if (userConnections) {
          userConnections.delete(controller)
          if (userConnections.size === 0) {
            connections.delete(userId)
          }
        }
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
