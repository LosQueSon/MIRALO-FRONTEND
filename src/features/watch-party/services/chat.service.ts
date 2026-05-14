import type { ChatMessage } from "../types/chat"

export const toWebSocketBaseUrl = (value: string): string => {
  const trimmed = value.replace(/\/$/, "")
  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}`
  }

  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length)}`
  }

  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed
  }

  return `ws://${trimmed}`
}

export const buildChatSocketUrl = (roomId: string, userId: string): string => {
  const baseUrl = toWebSocketBaseUrl(
    process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000",
  )

  return `${baseUrl}/ws/rooms/${encodeURIComponent(roomId)}/chat?userId=${encodeURIComponent(userId)}`
}

export const normalizeChatMessage = (payload: unknown): ChatMessage | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const source = payload as Record<string, unknown>
  const id = typeof source.id === "string" ? source.id : ""
  const userId = typeof source.userId === "string" ? source.userId : ""
  const content = typeof source.content === "string" ? source.content : ""
  const type = source.type === "system" || source.type === "reaction" ? source.type : "text"
  const timestamp = typeof source.timestamp === "string" ? source.timestamp : new Date().toISOString()

  if (!id || !userId) {
    return null
  }

  return {
    id,
    userId,
    content,
    type,
    timestamp,
    isPinned: Boolean(source.isPinned),
  }
}

export const normalizeChatMessages = (payload: unknown): ChatMessage[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeChatMessage).filter((message): message is ChatMessage => message !== null)
}
