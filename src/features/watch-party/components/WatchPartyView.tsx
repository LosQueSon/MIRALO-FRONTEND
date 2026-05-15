"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ConfirmLeaveModal from "@/components/layout/ConfirmLeaveModal"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuthStore } from "@/store/auth.store"
import { getReady } from "@/lib/backend/health"
import { REQUEST_LEAVE_ACTIVE_ROOM_EVENT } from "@/lib/room-navigation"
import { useYouTubePlayer } from "../hooks/useYouTubePlayer"

import {
  getUsersFavoriteGenres,
  getWatchPartyRooms,
  getWatchState,
  joinWatchPartyRoom,
  leaveWatchPartyRoom,
  patchWatchState,
  resolveSessionUser,
  deleteRoom,
} from "../services/watch-party.service"
import { RoomChatPanel } from "./RoomChatPanel"
import DeleteRoomModal from "./DeleteRoomModal"
import type { WatchPartyRoom, WatchState } from "../types"

const POLLING_INTERVAL_MS = 3000
const SOCKET_RECONNECT_DELAY_MS = 2000
const SEEK_STEP_MS = 15000
const READY_POLL_INTERVAL_MS = 10000
const EMPTY_PARTICIPANTS: string[] = []

type SocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error"
type SkipDirection = "backward" | "forward"

const PlayIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} -translate-x-px`} fill="currentColor" aria-hidden="true">
    <path d="M8 5.2c0-.8.9-1.3 1.6-.9l9 6.1c.6.4.6 1.3 0 1.8l-9 6.1c-.7.4-1.6 0-1.6-.9V5.2z" />
  </svg>
)

const PauseIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <rect x="6.5" y="5" width="4" height="14" rx="1" />
    <rect x="13.5" y="5" width="4" height="14" rx="1" />
  </svg>
)

const SkipIcon = ({ direction, className = "h-5 w-5" }: { direction: SkipDirection; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} ${direction === "backward" ? "-translate-x-px" : "translate-x-px"}`}
    fill="currentColor"
    aria-hidden="true"
  >
    {direction === "backward" ? (
      <>
        <rect x="4" y="5" width="2.5" height="14" rx="0.7" />
        <path d="M18.8 5.5c0-.8-.9-1.3-1.6-.9l-6.1 4.1c-.6.4-.6 1.3 0 1.8l6.1 4.1c.7.5 1.6 0 1.6-.8V5.5z" />
        <path d="M13.3 5.5c0-.8-.9-1.3-1.6-.9L5.6 8.7c-.6.4-.6 1.3 0 1.8l6.1 4.1c.7.5 1.6 0 1.6-.8V5.5z" />
      </>
    ) : (
      <>
        <rect x="17.5" y="5" width="2.5" height="14" rx="0.7" />
        <path d="M5.2 5.5c0-.8.9-1.3 1.6-.9l6.1 4.1c.6.4.6 1.3 0 1.8l-6.1 4.1c-.7.5-1.6 0-1.6-.8V5.5z" />
        <path d="M10.7 5.5c0-.8.9-1.3 1.6-.9l6.1 4.1c.6.4.6 1.3 0 1.8l-6.1 4.1c-.7.5-1.6 0-1.6-.8V5.5z" />
      </>
    )}
  </svg>
)

const toTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const parseYouTubeVideoId = (url: string): string | null => {
  if (!url.trim()) {
    return null
  }

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim()
      return id || null
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v")
      if (id) {
        return id
      }

      const parts = parsed.pathname.split("/").filter(Boolean)
      const embedIndex = parts.indexOf("embed")
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1]
      }

      const shortsIndex = parts.indexOf("shorts")
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1]
      }

      const liveIndex = parts.indexOf("live")
      if (liveIndex >= 0 && parts[liveIndex + 1]) {
        return parts[liveIndex + 1]
      }
    }
  } catch {
    return null
  }

  return null
}

const shortId = (value: string): string => {
  if (value.length <= 10) {
    return value
  }

  return `${value.slice(0, 5)}...${value.slice(-4)}`
}

const formatGenreLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "Sin genero"
  }

  const normalized = value.trim()
  if (!normalized) {
    return "Sin genero"
  }

  return normalized[0].toUpperCase() + normalized.slice(1)
}

const toWebSocketBaseUrl = (value: string): string => {
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

const parseSocketState = (payload: unknown): WatchState | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const source = payload as Record<string, unknown>
  return {
    isPlaying: Boolean(source.isPlaying),
    positionMs: typeof source.positionMs === "number" ? source.positionMs : 0,
    updatedBy: typeof source.updatedBy === "string" ? source.updatedBy : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date().toISOString(),
    version: typeof source.version === "number" ? source.version : 0,
  }
}

export function WatchPartyView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomIdFromQuery = searchParams.get("roomId") ?? ""
  const token = useAuthStore((state) => state.token)

  const [rooms, setRooms] = useState<WatchPartyRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string>("")
  const [state, setState] = useState<WatchState | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string>("")
  const [positionInput, setPositionInput] = useState<string>("0")
  const [participantGenres, setParticipantGenres] = useState<Record<string, string | null>>({})
  // userNames stores resolved display names; if a user has no name we store a fallback (shortId)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [isLoadingNames, setIsLoadingNames] = useState<boolean>(false)
  const fetchingRef = useRef<Set<string>>(new Set())
  const [lastSyncLabel, setLastSyncLabel] = useState<string>("")
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true)

  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [, setIsLoadingState] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingRoom, setIsDeletingRoom] = useState(false)
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("idle")
  const [socketRetryNonce, setSocketRetryNonce] = useState(0)
  const [isBackendReady, setIsBackendReady] = useState(true)
  const [isStrictRedisMode, setIsStrictRedisMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const overlayHideTimerRef = useRef<number | null>(null)
  const isTransitioningRoomRef = useRef(false)
  const [areOverlayControlsVisible, setAreOverlayControlsVisible] = useState(true)

  // Hook de YouTube Player - gestiona el reproductor sin conocer el estado global
  const videoId = useMemo(() => {
    const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
    const url = selectedRoom?.contentUrl ?? ""
    return parseYouTubeVideoId(url)
  }, [rooms, selectedRoomId])

  const { state: playerState, executeCommand, syncTime } = useYouTubePlayer(videoId, "youtube-player-container")
  
    const livePlaybackMs = useMemo(() => {
      if (playerState.isReady) {
        return Math.max(0, Math.floor(playerState.currentTime * 1000))
      }
  
      return state?.positionMs ?? 0
    }, [playerState.currentTime, playerState.isReady, state?.positionMs])

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  )

  const loadRooms = useCallback(async (background = false) => {
    try {
      if (!background) {
        setIsLoadingRooms(true)
      }

      const roomList = await getWatchPartyRooms()
      setRooms(roomList)
      setSelectedRoomId((current) => {
        if (roomIdFromQuery && roomList.some((room) => room.id === roomIdFromQuery)) {
          return roomIdFromQuery
        }

        if (!current) {
          return roomList[0]?.id || ""
        }

        return roomList.some((room) => room.id === current) ? current : roomList[0]?.id || ""
      })
      setLastSyncLabel(new Date().toLocaleTimeString("es-CO"))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No fue posible cargar las salas"
      setError(message)
    } finally {
      if (!background) {
        setIsLoadingRooms(false)
      }
    }
  }, [roomIdFromQuery])

  useEffect(() => {
    if (!roomIdFromQuery) {
      return
    }

    if (!rooms.some((room) => room.id === roomIdFromQuery)) {
      return
    }

    setSelectedRoomId(roomIdFromQuery)
  }, [roomIdFromQuery, rooms])

  const loadState = useCallback(async (roomId: string, background = false) => {
    if (!roomId) {
      setState(null)
      return
    }

    try {
      if (!background) {
        setIsLoadingState(true)
      }

      const watchState = await getWatchState(roomId)
      setState(watchState.state)
      setPositionInput(String(Math.floor(watchState.state.positionMs / 1000)))
      setLastSyncLabel(new Date().toLocaleTimeString("es-CO"))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No fue posible cargar el estado de reproduccion"
      setError(message)
    } finally {
      if (!background) {
        setIsLoadingState(false)
      }
    }
  }, [])

  const loadParticipantGenres = useCallback(async (roomId: string) => {
    if (!roomId) {
      setParticipantGenres({})
      return
    }

    try {
      const genres = await getUsersFavoriteGenres(roomId)
      const nextMap = genres.reduce<Record<string, string | null>>((accumulator, item) => {
        accumulator[item.userId] = item.favoriteGenre
        return accumulator
      }, {})

      setParticipantGenres(nextMap)
    } catch {
      setParticipantGenres({})
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      setError(null)
      await loadRooms()

      if (!token) {
        return
      }

      try {
        const sessionUser = await resolveSessionUser(token)
        setSessionUserId(sessionUser.id)
        setUserNames((prev) => ({ ...prev, [sessionUser.id]: sessionUser.name }))
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "No fue posible resolver el usuario"
        setError(message)
      }
    }

    void bootstrap()
  }, [loadRooms, token])

  useEffect(() => {
    let cancelled = false

    const refreshReadyStatus = async () => {
      const response = await getReady()
      if (cancelled) {
        return
      }

      if (!response) {
        setIsBackendReady(false)
        return
      }

      setIsBackendReady(response.status === "ready")
      setIsStrictRedisMode(Boolean(response.strictRedis))
    }

    void refreshReadyStatus()
    const interval = window.setInterval(() => {
      void refreshReadyStatus()
    }, READY_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!selectedRoomId) {
      setState(null)
      return
    }

    void loadState(selectedRoomId)
  }, [loadState, selectedRoomId])

  useEffect(() => {
    if (!isAutoRefreshEnabled || !selectedRoomId) {
      return
    }

    const interval = window.setInterval(() => {
      void loadRooms(true)
      if (socketStatus !== "connected") {
        void loadState(selectedRoomId, true)
      }
    }, POLLING_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [isAutoRefreshEnabled, loadRooms, loadState, selectedRoomId, socketStatus])

  const ensureJoined = async (roomId: string) => {
    if (!token) {
      throw new Error("No hay sesion activa")
    }

    const resolvedUserId = sessionUserId || (await resolveSessionUser(token)).id
    if (!sessionUserId) {
      setSessionUserId(resolvedUserId)
    }

    const room = rooms.find((item) => item.id === roomId)
    const isParticipant = room?.userIds?.includes(resolvedUserId)

    if (!isParticipant) {
      await joinWatchPartyRoom(roomId, token)
      await loadRooms(true)
    }
  }

  const handleAction = async (action: "play" | "pause" | "seek", positionMs: number) => {
    if (!selectedRoomId || !token) {
      setError("Selecciona una sala y verifica tu sesion")
      return
    }

    if (isPlaybackBlocked) {
      setError("El backend no esta listo y Redis esta en modo estricto. Intenta de nuevo en unos segundos")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await ensureJoined(selectedRoomId)
      const canUseSocket = socketRef.current?.readyState === WebSocket.OPEN

      if (canUseSocket) {
        console.log("[WebSocket Watch Party] Enviando acción por socket:", action, "positionMs:", positionMs)
        socketRef.current?.send(JSON.stringify({ event: action, positionMs }))
      } else {
        console.log("[WebSocket Watch Party] Socket no disponible, usando API REST:", action)
        const updated = await patchWatchState(selectedRoomId, action, positionMs, token)
        setState(updated.state)
        setPositionInput(String(Math.floor(updated.state.positionMs / 1000)))
      }
      
      // Ejecutar comando en el reproductor
      if (action === "play") {
        executeCommand("play")
      } else if (action === "pause") {
        executeCommand("pause")
      } else if (action === "seek") {
        executeCommand("seekTo", Math.floor(positionMs / 1000))
      }

      await loadRooms(true)
      await loadParticipantGenres(selectedRoomId)
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "No fue posible actualizar la reproduccion"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const showOverlayControls = useCallback(() => {
    setAreOverlayControlsVisible(true)

    if (overlayHideTimerRef.current !== null) {
      window.clearTimeout(overlayHideTimerRef.current)
      overlayHideTimerRef.current = null
    }

    if (state?.isPlaying) {
      overlayHideTimerRef.current = window.setTimeout(() => {
        setAreOverlayControlsVisible(false)
      }, 1600)
    }
  }, [state?.isPlaying])

  const hideOverlayControls = useCallback(() => {
    if (overlayHideTimerRef.current !== null) {
      window.clearTimeout(overlayHideTimerRef.current)
      overlayHideTimerRef.current = null
    }

    if (state?.isPlaying) {
      setAreOverlayControlsVisible(false)
    }
  }, [state?.isPlaying])

  useEffect(() => {
    return () => {
      if (overlayHideTimerRef.current !== null) {
        window.clearTimeout(overlayHideTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!state) {
      return
    }

    // Mantiene el player sincronizado incluso cuando el estado llega por REST/polling
    syncTime(state.positionMs, state.isPlaying)
  }, [state, syncTime])

  const parsedSeconds = Number.parseInt(positionInput, 10)
  const isValidSeconds = Number.isFinite(parsedSeconds) && parsedSeconds >= 0
  const isPlaybackBlocked = !isBackendReady && isStrictRedisMode
  const participants = selectedRoom?.userIds ?? EMPTY_PARTICIPANTS
  const participantsKey = useMemo(() => participants.join("|"), [participants])
  const isCurrentUserInRoom = sessionUserId ? participants.includes(sessionUserId) : false

  useEffect(() => {
    if (!selectedRoomId) {
      setParticipantGenres({})
      return
    }

    void loadParticipantGenres(selectedRoomId)
  }, [loadParticipantGenres, selectedRoomId, participantsKey])

  // Fetch participant display names (id -> name) so UI can show usernames instead of ids
  useEffect(() => {
    if (!selectedRoomId) return

    const missing = participants.filter((id) => !(id in userNames) && !fetchingRef.current.has(id))
    if (missing.length === 0) {
      setIsLoadingNames(false)
      return
    }

    let cancelled = false
    setIsLoadingNames(true)

    const fetchBatch = async () => {
      try {
        // mark in-flight
        for (const id of missing) fetchingRef.current.add(id)

        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const response = await fetch(`/api/discovery/users/${encodeURIComponent(id)}`)
              if (!response.ok) {
                return { id, name: shortId(id) }
              }
              const payload = await response.json().catch(() => null)
              return { id, name: payload && typeof payload.name === "string" && payload.name.trim() ? payload.name : shortId(id) }
            } catch {
              return { id, name: shortId(id) }
            }
          }),
        )

        if (cancelled) return

        setUserNames((prev) => {
          const next = { ...prev }
          for (const r of results) {
            next[r.id] = r.name
            fetchingRef.current.delete(r.id)
          }
          return next
        })
      } finally {
        if (!cancelled) setIsLoadingNames(false)
      }
    }

    void fetchBatch()

    return () => {
      cancelled = true
    }
  }, [participantsKey, selectedRoomId])

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

  useEffect(() => {
    if (!selectedRoomId || !sessionUserId || !isCurrentUserInRoom) {
      closeSocket()
      setSocketStatus("idle")
      return
    }

    const baseUrl = toWebSocketBaseUrl(
      process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000",
    )
    const endpoint = `${baseUrl}/ws/rooms/${encodeURIComponent(selectedRoomId)}/watch?userId=${encodeURIComponent(sessionUserId)}`

    console.log("[WebSocket Watch Party] Conectando a:", endpoint)
    setSocketStatus("connecting")
    const socket = new WebSocket(endpoint)
    socketRef.current = socket

    let cancelled = false
    const currentRoomId = selectedRoomId

    socket.onopen = () => {
      if (cancelled) {
        return
      }

      console.log("[WebSocket Watch Party] Conectado exitosamente")
      setSocketStatus("connected")
      socket.send(JSON.stringify({ event: "get_state" }))
      console.log("[WebSocket Watch Party] Enviado: get_state")
    }

    socket.onmessage = (event) => {
      if (cancelled || currentRoomId !== selectedRoomId || isTransitioningRoomRef.current) {
        return
      }

      try {
        const payload = JSON.parse(event.data as string) as {
          event?: string
          message?: string
          data?: unknown
        }

        if (payload.event === "error") {
          console.error("[WebSocket Watch Party] Error del servidor:", payload.message)
          setError(payload.message ?? "Error en el canal de tiempo real")
          return
        }

        if (payload.event === "connected" || payload.event === "watch_state") {
          const socketState = parseSocketState(payload.data)
          if (!socketState) {
            console.warn("[WebSocket Watch Party] No se pudo parsear el estado")
            return
          }

          console.log("[WebSocket Watch Party] Estado sincronizado:", socketState)
          setState(socketState)
          setPositionInput(String(Math.floor(socketState.positionMs / 1000)))
          setLastSyncLabel(new Date().toLocaleTimeString("es-CO"))

          // Sincronizar el reproductor con el estado del backend
          syncTime(socketState.positionMs, socketState.isPlaying)
        }
      } catch (error) {
        console.error("[WebSocket Watch Party] Error procesando mensaje:", error instanceof Error ? error.message : "Desconocido")
      }
    }

    socket.onerror = () => {
      if (cancelled) {
        return
      }

      console.error("[WebSocket Watch Party] Error en el socket")
      setSocketStatus("error")
    }

    socket.onclose = () => {
      if (cancelled) {
        return
      }

      console.log("[WebSocket Watch Party] Desconectado - Reintentando en", SOCKET_RECONNECT_DELAY_MS, "ms")
      setSocketStatus("disconnected")
      reconnectTimerRef.current = window.setTimeout(() => {
        setSocketRetryNonce((value) => value + 1)
      }, SOCKET_RECONNECT_DELAY_MS)
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
  }, [closeSocket, isCurrentUserInRoom, selectedRoomId, sessionUserId, socketRetryNonce, syncTime])

  const handleLeaveRoom = async (redirectPath = "/discovery") => {
    if (!selectedRoomId || !token) {
      setError("No hay sala seleccionada o sesion activa")
      setIsLeaveModalOpen(false)
      return
    }

    try {
      setIsLeavingRoom(true)
      setError(null)
      // Immediately update UI to remove current user from participants for instant feedback
      setUserNames((prev) => {
        const next = { ...prev }
        delete next[sessionUserId]
        return next
      })
      // call backend to leave
      await leaveWatchPartyRoom(selectedRoomId, token)
      closeSocket()
      await loadRooms(true)
      setIsLeaveModalOpen(false)
      router.push(redirectPath)
    } catch (leaveError) {
      const message = leaveError instanceof Error ? leaveError.message : "No fue posible salir de la room"
      setError(message)
    } finally {
      setIsLeavingRoom(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!selectedRoomId || !token) {
      throw new Error("No hay sala seleccionada o sesion activa")
    }

    try {
      setIsDeletingRoom(true)
      setError(null)
      await deleteRoom(selectedRoomId, token)
      closeSocket()
      await loadRooms(true)
      setIsDeleteModalOpen(false)
      router.push("/my-rooms")
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "No fue posible eliminar la sala"
      setError(message)
      throw deleteError
    } finally {
      setIsDeletingRoom(false)
    }
  }

  useEffect(() => {
    const handleLeaveRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ targetPath?: string }>
      const targetPath = customEvent.detail?.targetPath ?? "/discovery"

      if (!selectedRoomId) {
        router.push(targetPath)
        return
      }

      void handleLeaveRoom(targetPath)
    }

    window.addEventListener(REQUEST_LEAVE_ACTIVE_ROOM_EVENT, handleLeaveRequest)

    return () => {
      window.removeEventListener(REQUEST_LEAVE_ACTIVE_ROOM_EVENT, handleLeaveRequest)
    }
  }, [handleLeaveRoom, router, selectedRoomId])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black/40">
      {/* Control bar - Sticky header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/60 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-white">{selectedRoom?.name || "Watch Party"}</h1>
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-2 w-2 rounded-full ${socketStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-xs text-white/60">
                  {socketStatus === "connected"
                    ? "Conectado (tiempo real)"
                    : socketStatus === "connecting"
                    ? "Conectando..."
                    : isAutoRefreshEnabled
                    ? "Offline — usando polling"
                    : "Offline"}
                </span>
                <span className="text-xs text-white/40">• Sync: {lastSyncLabel || "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedRoom && sessionUserId === selectedRoom.hostId && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={!selectedRoomId || isDeletingRoom}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-red-600/30 bg-red-600/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar sala"
                >
                  Eliminar
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              disabled={!selectedRoomId || isLeavingRoom}
              className="inline-flex h-11 min-w-[8.75rem] items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLeavingRoom ? "Saliendo..." : "Salir"}
            </button>
          </div>
        </div>
      </div>

      {/* Leave confirmation modal */}
      <ConfirmLeaveModal
        isOpen={isLeaveModalOpen}
        title="Salir de la sala"
        message="Vas a salir de la sala. ¿Estás seguro?"
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onConfirm={() => void handleLeaveRoom()}
        onCancel={() => setIsLeaveModalOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex gap-6 p-6">
        {/* Video section - Left */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Reproductor */}
          <div
            className="relative flex-1 rounded-2xl border border-white/10 bg-black/60 overflow-hidden"
            onMouseMove={showOverlayControls}
            onMouseEnter={showOverlayControls}
            onMouseLeave={hideOverlayControls}
            onTouchStart={showOverlayControls}
          >
            {isLoadingRooms ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/60">Cargando...</p>
              </div>
            ) : videoId ? (
              <div id="youtube-player-container" className="flex-1 overflow-hidden rounded-lg" />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <p className="text-sm text-white/60">Selecciona una sala con URL válida de YouTube</p>
              </div>
            )}

            {/* Netflix-style controls overlay */}
            {selectedRoom && state && videoId ? (
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
                  areOverlayControlsVisible || !state.isPlaying ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="pointer-events-auto flex items-center justify-center gap-3">
                  <button
                    type="button"
                    aria-label="Retroceder 15 segundos"
                    className="h-12 w-12 rounded-full border border-red-500/40 bg-white text-red-600 backdrop-blur-sm transition hover:scale-105 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleAction("seek", Math.max(0, livePlaybackMs - SEEK_STEP_MS))}
                    disabled={!selectedRoomId || isSubmitting || isPlaybackBlocked}
                    title="Retroceder 15 segundos"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center">
                      <SkipIcon direction="backward" className="h-5 w-5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={state.isPlaying ? "Pausar" : "Reproducir"}
                    className="h-14 w-14 rounded-full bg-red-600 text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition hover:scale-105 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleAction(state.isPlaying ? "pause" : "play", livePlaybackMs)}
                    disabled={!selectedRoomId || isSubmitting || isPlaybackBlocked}
                    title={state.isPlaying ? "Pausar" : "Reproducir"}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center">
                      {state.isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Adelantar 15 segundos"
                    className="h-12 w-12 rounded-full border border-red-500/40 bg-white text-red-600 backdrop-blur-sm transition hover:scale-105 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleAction("seek", livePlaybackMs + SEEK_STEP_MS)}
                    disabled={!selectedRoomId || isSubmitting || isPlaybackBlocked}
                    title="Adelantar 15 segundos"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center">
                      <SkipIcon direction="forward" className="h-5 w-5" />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Playback controls - Bottom */}
          {selectedRoom && state && (
            <div className="mt-4 space-y-3">
              {isPlaybackBlocked ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  El backend no esta listo y Redis esta en modo estricto. Controles de reproduccion bloqueados temporalmente.
                </div>
              ) : null}

              {/* Estado */}
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${state.isPlaying ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="text-sm text-white/80">
                    {state.isPlaying ? "Reproduciendo" : "Pausado"} • {toTime(livePlaybackMs)}
                  </span>
                </div>
                <span className="text-xs text-white/40">v{state.version}</span>
              </div>

              {/* Controles */}
              <div className="space-y-3">
                {/* Seek control */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={positionInput}
                    onChange={(event) => setPositionInput(event.target.value)}
                    placeholder="seg"
                    className="w-24 h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-red-500/40"
                  />
                  <button
                    type="button"
                    className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-500 border border-red-500 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleAction("seek", (isValidSeconds ? parsedSeconds : 0) * 1000)}
                    disabled={!selectedRoomId || isSubmitting || !isValidSeconds || isPlaybackBlocked}
                  >
                    Ir a tiempo
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right sidebar - Chat & Participants */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          {/* Participantes */}
          {selectedRoom && (
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 flex flex-col">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Participantes</p>
                <p className="mt-1 text-lg font-bold text-white">{participants.length}/{selectedRoom.maxUsers}</p>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {participants.length === 0 ? (
                  <span className="text-xs text-white/50">Sin participantes</span>
                ) : isLoadingNames ? (
                  // show skeleton placeholders while resolving names to avoid flash
                  participants.map((participantId) => (
                    <div
                      key={participantId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        participantId === sessionUserId
                          ? "bg-red-600/20 border border-red-500/50 text-red-200"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: participantId === sessionUserId ? "#dc2626" : "#ffffff33" }} />
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="h-3 w-32 rounded bg-white/10 animate-pulse" />
                        <div className="h-3 w-20 rounded bg-white/6 mt-1" />
                      </div>
                    </div>
                  ))
                ) : (
                  participants.map((participantId) => (
                    <div
                      key={participantId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        participantId === sessionUserId
                          ? "bg-red-600/20 border border-red-500/50 text-red-200"
                          : "bg-white/5 border border-white/10 text-white/70"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: participantId === sessionUserId ? "#dc2626" : "#ffffff33"}} />
                      <div className="flex flex-col gap-0.5">
                        <span>{participantId === sessionUserId ? "Tu" : (userNames[participantId] ?? shortId(participantId))}</span>
                        <span className="text-[10px] text-white/50">{formatGenreLabel(participantGenres[participantId])}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 overflow-hidden flex flex-col min-h-0">
            <RoomChatPanel
              roomId={selectedRoomId}
              roomName={selectedRoom?.name ?? "Sala"}
              userId={sessionUserId}
              userNames={userNames}
              isActive={Boolean(selectedRoomId && isCurrentUserInRoom)}
            />
          </div>
        </div>
      </div>

      {/* Delete Room Modal */}
      <DeleteRoomModal
        isOpen={isDeleteModalOpen}
        roomName={selectedRoom?.name ?? "Sala"}
        isSubmitting={isDeletingRoom}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRoom}
      />
    </div>
  )
}
