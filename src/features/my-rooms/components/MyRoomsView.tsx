"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import FeaturePageShell from "@/components/layout/FeaturePageShell"
import { getDiscoveryRooms, getDiscoverySessionUser, joinDiscoveryRoom } from "@/features/discovery/services/rooms.service"
import { ROOMS_UPDATED_EVENT, ROOMS_UPDATED_STORAGE_KEY } from "@/lib/rooms-sync"
import type { DiscoveryRoom } from "@/features/discovery/types"

type LoadState = "loading" | "success" | "empty" | "error"

const stateLabel: Record<DiscoveryRoom["state"], string> = {
  waiting: "En espera",
  active: "Activa",
  finished: "Finalizada",
}

const parseYouTubeVideoId = (url: string): string | null => {
  if (!url.trim()) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim()
      return id || null
    }
    if (parsed.hostname.includes("youtube.com")) {
      const directId = parsed.searchParams.get("v")
      if (directId) return directId

      const parts = parsed.pathname.split("/").filter(Boolean)
      const embedIndex = parts.indexOf("embed")
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]

      const shortsIndex = parts.indexOf("shorts")
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1]

      const liveIndex = parts.indexOf("live")
      if (liveIndex >= 0 && parts[liveIndex + 1]) return parts[liveIndex + 1]
    }
  } catch {
    return null
  }
  return null
}

const getThumbnailUrl = (contentUrl: string): string => {
  const videoId = parseYouTubeVideoId(contentUrl)
  if (!videoId) return ""
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export default function MyRoomsView() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [rooms, setRooms] = useState<DiscoveryRoom[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [backendUserId, setBackendUserId] = useState("")
  const [actionRoomId, setActionRoomId] = useState("")

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        // fallback to client-side known user id if available
        setBackendUserId(user?.id ?? "")
        return
      }

      try {
        const sessionUser = await getDiscoverySessionUser(token)
        setBackendUserId(sessionUser.id)
      } catch {
        // In production the session-user endpoint may fail due to env/cors/token issues.
        // Fall back to the auth store's user id so "Mis salas" can still list creator rooms.
        setBackendUserId(user?.id ?? "")
      }
    }

    void bootstrap()
  }, [token])

  useEffect(() => {
    const load = async () => {
      try {
        setLoadState("loading")
        const response = await getDiscoveryRooms()
        const nextRooms = backendUserId
          ? response.rooms.filter((room) => room.hostId === backendUserId || room.userIds.includes(backendUserId))
          : []
        setRooms(nextRooms)
        setLoadState(nextRooms.length > 0 ? "success" : "empty")
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar tus salas")
        setLoadState("error")
      }
    }

    void load()
  }, [backendUserId])

  useEffect(() => {
    const refreshRooms = () => {
      void getDiscoveryRooms().then((response) => {
        const nextRooms = backendUserId
          ? response.rooms.filter((room) => room.hostId === backendUserId || room.userIds.includes(backendUserId))
          : []
        setRooms(nextRooms)
        setLoadState(nextRooms.length > 0 ? "success" : "empty")
      }).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar tus salas")
        setLoadState("error")
      })
    }

    const handleRoomsUpdated = () => {
      void refreshRooms()
    }

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === ROOMS_UPDATED_STORAGE_KEY) {
        void refreshRooms()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshRooms()
      }
    }

    window.addEventListener(ROOMS_UPDATED_EVENT, handleRoomsUpdated)
    window.addEventListener("storage", handleStorageUpdate)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const intervalId = window.setInterval(() => {
      void refreshRooms()
    }, 15000)

    return () => {
      window.removeEventListener(ROOMS_UPDATED_EVENT, handleRoomsUpdated)
      window.removeEventListener("storage", handleStorageUpdate)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [backendUserId])

  const openRoom = async (roomId: string) => {
    if (!token) return
    setActionRoomId(roomId)
    try {
      await joinDiscoveryRoom(roomId, token)
      router.push(`/watch-party?roomId=${encodeURIComponent(roomId)}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible abrir la sala")
    } finally {
      setActionRoomId("")
    }
  }

  return (
    <FeaturePageShell
      title="Tus salas"
      description="Aquí se concentran las salas donde participas o que administras. Es el acceso más rápido a tus watch parties activas y a las que ya abriste antes."
    >
      <section className="space-y-5 lg:col-span-2">
        {loadState === "loading" ? (
          <div className="rounded-3xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">Cargando tus salas...</div>
        ) : null}

        {loadState === "error" ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">{errorMessage}</div>
        ) : null}

        {loadState === "empty" ? (
          <div className="rounded-3xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">
            Todavía no participas en ninguna sala. Usa el inicio para unirte a una pública o ingresar a una privada.
          </div>
        ) : null}

        {loadState === "success" ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article key={room.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/35">
                <div className="h-44 overflow-hidden bg-black">
                  <img src={getThumbnailUrl(room.contentUrl)} alt={room.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                      <span className="mt-1 inline-flex rounded-full border border-red-500/70 bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                        {stateLabel[room.state]}
                      </span>
                    </div>
                    <span className="rounded-full border border-red-500/70 bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                      {room.isPrivate ? "Privada" : "Pública"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/65">Usuarios: {room.userCount}/{room.maxUsers}</p>
                  <p className="mt-1 text-sm text-white/65">Actualizada: {room.updatedAtLabel}</p>
                  <button
                    type="button"
                    onClick={() => void openRoom(room.id)}
                    disabled={actionRoomId === room.id}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actionRoomId === room.id ? "Abriendo..." : "Abrir sala"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </FeaturePageShell>
  )
}
