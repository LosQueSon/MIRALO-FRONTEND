export interface ChatMessage {
  id: string
  userId: string
  content: string
  type: "text" | "system" | "reaction"
  timestamp: string
  isPinned: boolean
}

export interface ChatSocketError {
  code?: string
  message: string
}
