"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import FeaturePageShell from "@/components/layout/FeaturePageShell"
import { ROOMS_UPDATED_EVENT, ROOMS_UPDATED_STORAGE_KEY } from "@/lib/rooms-sync"
import {
  createDiscoveryRoom,
  getDiscoveryRooms,
  getDiscoverySessionUser,
  joinDiscoveryRoom,
} from "@/features/discovery/services/rooms.service"
import type { DiscoveryRoom } from "@/features/discovery/types"

type LoadState = "loading" | "success" | "empty" | "error"

const genreOptions = [
  { value: "action", label: "Accion" },
  { value: "adventure", label: "Aventura" },
  { value: "comedy", label: "Comedia" },
  { value: "drama", label: "Drama" },
  { value: "fantasy", label: "Fantasia" },
  { value: "horror", label: "Terror" },
  { value: "romance", label: "Romance" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "thriller", label: "Suspenso" },
  { value: "western", label: "Western" },
  { value: "other", label: "Otro" },
]

const stateLabel: Record<DiscoveryRoom["state"], string> = {
  waiting: "En espera",
  active: "Activa",
  finished: "Finalizada",
}
const roomDetailsHeadingClass = "text-xs uppercase tracking-[0.22em] text-red-500"

const defaultForm = {
  name: "",
  contentUrl: "",
  genres: "comedy",
  maxUsers: 8,
  isPrivate: false,
  accessCode: "",
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
      const directId = parsed.searchParams.get("v")
      if (directId) {
        return directId
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

const getThumbnailCandidates = (contentUrl: string): string[] => {
  const videoId = parseYouTubeVideoId(contentUrl)
  if (!videoId) {
    return []
  }

  return [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ]
}

function RoomPoster({ contentUrl, roomName }: { contentUrl: string; roomName: string }) {
  const candidates = useMemo(() => getThumbnailCandidates(contentUrl), [contentUrl])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [contentUrl])

  if (candidates.length === 0 || index >= candidates.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black px-4 text-center text-sm text-white/55">
        Sin miniatura disponible
      </div>
    )
  }

  return (
    <img
      src={candidates[index]}
      alt={`Miniatura de ${roomName}`}
      className="h-full w-full object-cover"
      onError={() => {
        setIndex((current) => current + 1)
      }}
    />
  )
}

export default function LoggedHomeView() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const openCreateRoomModal = useAuthStore((state) => state.openCreateRoomModal)

  const [rooms, setRooms] = useState<DiscoveryRoom[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [backendUserId, setBackendUserId] = useState<string>("")
  const [actionRoomId, setActionRoomId] = useState<string>("")
  const [isPortalReady, setIsPortalReady] = useState(false)

  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<DiscoveryRoom | null>(null)
  const [privateAccessCode, setPrivateAccessCode] = useState("")

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.state === "active").length,
    [rooms],
  )

  useEffect(() => {
    setIsPortalReady(true)
  }, [])

  const refreshRooms = async (options?: { background?: boolean }) => {
    const background = options?.background ?? false

    if (!background) {
      setLoadState("loading")
      setErrorMessage("")
    }

    try {
      const response = await getDiscoveryRooms()
      setRooms(response.rooms)
      setLoadState(response.rooms.length > 0 ? "success" : "empty")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado"

      setRooms([])
      setLoadState("error")
      setErrorMessage(message)
    }
  }

  useEffect(() => {
    void refreshRooms()
  }, [])

  useEffect(() => {
    const handleRoomsUpdated = () => {
      void refreshRooms({ background: true })
    }

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === ROOMS_UPDATED_STORAGE_KEY) {
        void refreshRooms({ background: true })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshRooms({ background: true })
      }
    }

    window.addEventListener(ROOMS_UPDATED_EVENT, handleRoomsUpdated)
    window.addEventListener("storage", handleStorageUpdate)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const intervalId = window.setInterval(() => {
      void refreshRooms({ background: true })
    }, 15000)

    return () => {
      window.removeEventListener(ROOMS_UPDATED_EVENT, handleRoomsUpdated)
      window.removeEventListener("storage", handleStorageUpdate)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    const resolveSessionUser = async () => {
      try {
        const backendUser = await getDiscoverySessionUser(token)
        if (!cancelled) {
          setBackendUserId(backendUser.id)
        }
      } catch {
        if (!cancelled) {
          setBackendUserId("")
        }
      }
    }

    void resolveSessionUser()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!selectedPrivateRoom) {
      return
    }

    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior

    const preventScroll = (event: Event) => {
      event.preventDefault()
    }

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.overscrollBehavior = "none"

    window.addEventListener("wheel", preventScroll, { passive: false })
    window.addEventListener("touchmove", preventScroll, { passive: false })

    return () => {
      window.removeEventListener("wheel", preventScroll)
      window.removeEventListener("touchmove", preventScroll)

      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior
      window.scrollTo(0, scrollY)
    }
  }, [selectedPrivateRoom])

  const joinAndGo = async (roomId: string, accessCode?: string) => {
    if (!token) {
      setErrorMessage("Necesitas una sesion activa para unirte")
      return
    }

    setActionRoomId(roomId)
    setErrorMessage("")

    try {
      await joinDiscoveryRoom(roomId, token, accessCode)
      await refreshRooms({ background: true })
      router.push(`/watch-party?roomId=${encodeURIComponent(roomId)}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible unirse")
    } finally {
      setActionRoomId("")
    }
  }

  const handleRoomCardClick = async (room: DiscoveryRoom) => {
    if (actionRoomId) {
      return
    }

    if (room.isPrivate) {
      setPrivateAccessCode("")
      setSelectedPrivateRoom(room)
      return
    }

    if (backendUserId && room.userIds.includes(backendUserId)) {
      router.push(`/watch-party?roomId=${encodeURIComponent(room.id)}`)
      return
    }

    await joinAndGo(room.id)
  }

  const privateRoomModal = selectedPrivateRoom ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onWheel={(event) => {
        event.preventDefault()
      }}
      onTouchMove={(event) => {
        event.preventDefault()
      }}
    >
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Sala privada</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{selectedPrivateRoom.name}</h3>
        <p className="mt-2 text-sm text-white/70">Ingresa el codigo de acceso para unirte a la sala.</p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-white/75">Codigo de acceso</span>
          <input
            value={privateAccessCode}
            onChange={(event) => setPrivateAccessCode(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
            placeholder="Escribe el codigo"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!privateAccessCode.trim() || actionRoomId === selectedPrivateRoom.id}
            onClick={() => {
              void joinAndGo(selectedPrivateRoom.id, privateAccessCode.trim())
            }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {actionRoomId === selectedPrivateRoom.id ? "Uniendome..." : "Entrar a la sala"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPrivateRoom(null)
              setPrivateAccessCode("")
            }}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <FeaturePageShell
      title={`Bienvenido${user?.name ? `, ${user.name}` : ""}`}
      description="Explora salas activas y entra directo a ver contenido en grupo. Esta vista concentra el flujo principal de descubrimiento y acceso a watch party."
    >
      <section className="lg:col-span-2 space-y-5">
        <section className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Salas disponibles</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Descubrir y entrar</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-red-500/70 bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                {activeRooms} activas
              </span>
              <button
                type="button"
                onClick={() => {
                  openCreateRoomModal()
                }}
                className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 lg:hidden"
              >
                Crear sala
              </button>
            </div>
          </div>

          {loadState === "loading" ? (
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">
              Cargando salas...
            </div>
          ) : null}

          {loadState === "error" ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-200">
              {errorMessage || "No se pudieron cargar las salas."}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    void refreshRooms()
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : null}

          {loadState === "empty" ? (
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">
              Aun no hay salas. Crea la primera desde el boton "Crear sala".
            </div>
          ) : null}

          {loadState === "success" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => {
                const isParticipant = backendUserId ? room.userIds.includes(backendUserId) : false

                return (
                  <article
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir sala ${room.name}`}
                    onClick={() => {
                      void handleRoomCardClick(room)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        void handleRoomCardClick(room)
                      }
                    }}
                    className="group cursor-pointer [perspective:1400px]"
                  >
                    <div className="relative h-[320px] w-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-black [backface-visibility:hidden]">
                        <RoomPoster contentUrl={room.contentUrl} roomName={room.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                          <span className="rounded-full border border-red-500/70 bg-red-600 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                            {room.genres}
                          </span>
                          <span className="rounded-full border border-red-500/70 bg-red-600 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                            {stateLabel[room.state]}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="line-clamp-1 text-2xl font-black text-white">{room.name}</h3>
                          <p className="mt-1 text-sm text-white/70">
                            {room.isPrivate ? "Sala privada" : "Sala publica"} · {room.userCount}/{room.maxUsers}
                          </p>
                        </div>
                      </div>

                      <div className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-red-500/30 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.24),transparent_40%),linear-gradient(145deg,rgba(12,12,16,0.96),rgba(5,5,8,0.96))] p-5 text-white [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <div>
                          <p className={roomDetailsHeadingClass}>Detalles de la sala</p>
                          <h4 className="mt-2 line-clamp-1 text-2xl font-black">{room.name}</h4>
                          <p className="mt-4 text-sm text-white/80">Usuarios: {room.userCount}/{room.maxUsers}</p>
                          <p className="mt-1 text-sm text-white/80">Tipo: {room.isPrivate ? "Privada" : "Publica"}</p>
                          <p className="mt-1 text-sm text-white/80">Estado: {stateLabel[room.state]}</p>
                          <p className="mt-1 text-sm text-white/65">Actualizada: {room.updatedAtLabel}</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                          {isParticipant
                            ? "Haz clic para abrir el reproductor"
                            : room.isPrivate
                              ? "Haz clic para ingresar con codigo"
                              : "Haz clic para unirte directamente"}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>

        {isPortalReady && privateRoomModal ? createPortal(privateRoomModal, document.body) : null}
      </section>
    </FeaturePageShell>
  )
}
