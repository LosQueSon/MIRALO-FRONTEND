"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ChatMessage } from "../types/chat"
import { buildChatSocketUrl, normalizeChatMessages, normalizeChatMessage } from "../services/chat.service"

const CHAT_RECONNECT_DELAY_MS = 2000

type ChatSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error"

type ChatSocketEvent = {
  event?: string
  message?: string
  data?: unknown
}

const shortId = (value: string): string => {
  if (value.length <= 10) {
    return value
  }

  return `${value.slice(0, 5)}...${value.slice(-4)}`
}

const formatTimestamp = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface RoomChatPanelProps {
  roomId: string
  roomName: string
  userId: string
  isActive: boolean
  userNames?: Record<string, string>
}

export function RoomChatPanel({ roomId, roomName, userId, isActive, userNames }: RoomChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [status, setStatus] = useState<ChatSocketStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const closeSocket = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      closeSocket()
    }
  }, [closeSocket])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!roomId || !userId || !isActive) {
      closeSocket()
      setStatus("idle")
      setMessages([])
      return
    }

    setStatus("connecting")
    const socket = new WebSocket(buildChatSocketUrl(roomId, userId))
    socketRef.current = socket
    let cancelled = false

    socket.onopen = () => {
      if (cancelled) {
        return
      }

      setStatus("connected")
      socket.send(JSON.stringify({ event: "get_history", limit: 50 }))
    }

    socket.onmessage = (event) => {
      if (cancelled) {
        return
      }

      try {
        const payload = JSON.parse(event.data as string) as ChatSocketEvent

        if (payload.event === "error") {
          setError(payload.message ?? "No fue posible procesar el chat")
          return
        }

        if (payload.event === "history") {
          setMessages(normalizeChatMessages(payload.data))
          return
        }

        if (payload.event === "new_message") {
          const nextMessage = normalizeChatMessage(payload.data)
          if (!nextMessage) {
            return
          }

          setMessages((current) => [...current, nextMessage])
          return
        }
      } catch {
        setError("No fue posible leer el evento del chat")
      }
    }

    socket.onerror = () => {
      if (cancelled) {
        return
      }

      setStatus("error")
    }

    socket.onclose = () => {
      if (cancelled) {
        return
      }

      setStatus("disconnected")
      reconnectTimerRef.current = window.setTimeout(() => {
        setRetryNonce((value) => value + 1)
      }, CHAT_RECONNECT_DELAY_MS)
    }

    return () => {
      cancelled = true
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }

      socket.close()
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [closeSocket, isActive, roomId, retryNonce, userId])

  const handleSendMessage = () => {
    if (!draft.trim() || status !== "connected" || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    socketRef.current.send(
      JSON.stringify({
        event: "send_message",
        content: draft.trim(),
        type: "text",
      }),
    )
    setDraft("")
  }

  const groupedMessages = useMemo(() => messages, [messages])

  return (
    <section className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Chat</h3>
          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
            status === "connected" ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300" :
            status === "connecting" ? "border border-amber-500/40 bg-amber-500/10 text-amber-300" :
            "border border-red-500/40 bg-red-500/10 text-red-300"
          }`}>
            <span className={`inline-block w-1 h-1 rounded-full ${
              status === "connected" ? "bg-emerald-500" :
              status === "connecting" ? "bg-amber-500" :
              "bg-red-500"
            }`} />
            {status === "connected" ? "En vivo" : "Offline"}
          </div>
        </div>
      </div>

      {!isActive ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-xs text-white/50">Entra a la sala</p>
        </div>
      ) : (
        <>
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-hide">
            {groupedMessages.length === 0 ? (
              <p className="text-center text-xs text-white/50 py-6">Sin mensajes aún</p>
            ) : (
              <>
                {groupedMessages.map((message) => {
                  const isOwnMessage = message.userId === userId

                  return (
                    <article key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${
                          isOwnMessage
                            ? "border border-red-500/40 bg-red-500/10 text-red-50"
                            : "border border-white/10 bg-white/5 text-white/90"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5 text-[9px] uppercase tracking-wider text-white/50 font-medium">
                          <span>{isOwnMessage ? "Tú" : (userNames && userNames[message.userId]) || shortId(message.userId)}</span>
                          <span className="text-white/30">{formatTimestamp(message.timestamp)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words leading-4">{message.content}</p>
                      </div>
                    </article>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-white/10 space-y-1.5">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={!isActive || status !== "connected"}
                placeholder="Mensaje..."
                className="flex-1 rounded-lg bg-white/[0.08] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 outline-none transition focus:border-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!isActive || status !== "connected" || !draft.trim()}
                className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                ✓
              </button>
            </div>
            {error && (
              <p className="text-[10px] text-red-300/80">{error}</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
