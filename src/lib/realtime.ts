// Store for active connections - using global to persist across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var sseConnections: Map<string, Set<ReadableStreamDefaultController>> | undefined
  // eslint-disable-next-line no-var
  var adminSseConnections: Set<ReadableStreamDefaultController> | undefined
}

// Initialize connections - always ensure they exist
if (!global.sseConnections) {
  global.sseConnections = new Map<string, Set<ReadableStreamDefaultController>>()
}
if (!global.adminSseConnections) {
  global.adminSseConnections = new Set<ReadableStreamDefaultController>()
}

export const connections = global.sseConnections
export const adminConnections = global.adminSseConnections

// Helper to send event to a specific user
export function sendEventToUser(userId: string, eventType: string, payload: unknown) {
  const userConnections = connections.get(userId)
  if (userConnections) {
    const data = JSON.stringify({ type: eventType, payload })
    userConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${data}\n\n`)
      } catch {
        // Connection closed, will be cleaned up
      }
    })
  }
}

// Helper to broadcast to all users
export function broadcastEvent(eventType: string, payload: unknown) {
  const data = JSON.stringify({ type: eventType, payload })
  connections.forEach(userConnections => {
    userConnections.forEach(controller => {
      try {
        controller.enqueue(`data: ${data}\n\n`)
      } catch {
        // Connection closed
      }
    })
  })
}

// Helper to broadcast to all admin users
export function broadcastToAdmins(eventType: string, payload: unknown) {
  const data = JSON.stringify({ type: eventType, payload })
  adminConnections.forEach(controller => {
    try {
      controller.enqueue(`data: ${data}\n\n`)
    } catch {
      // Connection closed, will be cleaned up
    }
  })
}

// Helper to notify admins of a client action
export function notifyAdminsOfClientAction(
  action: 'mpr_submitted' | 'mandate_submitted' | 'quotes_submitted' | 'invoices_submitted' | 'work_started' | 'message' | 'dossier_update',
  data: {
    dossierId: string
    clientName: string
    message?: string
  }
) {
  broadcastToAdmins(action, {
    ...data,
    action,
    timestamp: Date.now(),
  })
}
