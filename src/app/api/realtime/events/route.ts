import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Store for active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>()

// Helper to send event to a specific user
export function sendEventToUser(userId: string, eventType: string, payload: any) {
  const userConnections = connections.get(userId)
  if (userConnections) {
    const data = JSON.stringify({ type: eventType, payload })
    userConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${data}\n\n`)
      } catch (error) {
        // Connection closed, will be cleaned up
      }
    })
  }
}

// Helper to broadcast to all users
export function broadcastEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload })
  connections.forEach(userConnections => {
    userConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${data}\n\n`)
      } catch (error) {
        // Connection closed
      }
    })
  })
}

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
        } catch (error) {
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
