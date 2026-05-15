"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ConfirmLeaveModal from "@/components/layout/ConfirmLeaveModal"
import { useAuthStore } from "@/store/auth.store"
import FeaturePageShell from "@/components/layout/FeaturePageShell"
import { notifyRoomsUpdated, ROOMS_UPDATED_EVENT, ROOMS_UPDATED_STORAGE_KEY } from "@/lib/rooms-sync"
import {
  createDiscoveryRoom,
  getDiscoveryRooms,
  getDiscoverySessionUser,
  joinDiscoveryRoom,
  leaveDiscoveryRoom,
} from "@/features/discovery/services/rooms.service"
import { DiscoveryRoom } from "@/features/discovery/types"

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
      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black px-4 text-center text-sm text-white/55">
        Sin miniatura disponible
      </div>
    )
  }

  return (
    <img
      src={candidates[index]}
      alt={`Miniatura de ${roomName}`}
      className="aspect-video w-full object-cover"
      onError={() => {
        setIndex((current) => current + 1)
      }}
    />
  )
}

export default function DiscoveryRoomsView() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [rooms, setRooms] = useState<DiscoveryRoom[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [formState, setFormState] = useState(defaultForm)
  const [isCreating, setIsCreating] = useState(false)
  const [actionRoomId, setActionRoomId] = useState<string>("")
  const [confirmLeaveRoomId, setConfirmLeaveRoomId] = useState<string>("")
  const [createMessage, setCreateMessage] = useState<string>("")
  const [createError, setCreateError] = useState<string>("")
  const [backendUserId, setBackendUserId] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [joinAccessCodes, setJoinAccessCodes] = useState<Record<string, string>>({})

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

      if (background) {
        setCreateError(message)
        return
      }

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

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.state === "active").length,
    [rooms],
  )

  const handleJoinRoom = async (roomId: string, accessCode?: string) => {
    if (!token) {
      setCreateError("Necesitas sesion activa para unirte")
      return
    }

    setActionRoomId(roomId)
    setCreateError("")

    try {
      await joinDiscoveryRoom(roomId, token, accessCode)
      await refreshRooms({ background: true })
      router.push(`/watch-party?roomId=${encodeURIComponent(roomId)}`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No fue posible unirse")
    } finally {
      setActionRoomId("")
    }
  }

  const handleLeaveRoom = async (roomId: string) => {
    if (!token) {
      setCreateError("Necesitas sesion activa para salir")
      return
    }

    setActionRoomId(roomId)
    setCreateError("")

    try {
      await leaveDiscoveryRoom(roomId, token)
      await refreshRooms({ background: true })
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No fue posible salir")
    } finally {
      setActionRoomId("")
    }
  }

  const handleConfirmLeave = async (roomId: string) => {
    setConfirmLeaveRoomId("")
    await handleLeaveRoom(roomId)
  }

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim() || !formState.contentUrl.trim()) {
      setCreateError("Completa el nombre y el link de YouTube")
      return
    }

    setIsCreating(true)
    setCreateError("")
    setCreateMessage("")

    try {
      const created = await createDiscoveryRoom({
        name: formState.name.trim(),
        contentUrl: formState.contentUrl.trim(),
        genres: formState.genres,
        maxUsers: Number(formState.maxUsers),
        isPrivate: formState.isPrivate,
        accessCode: formState.isPrivate ? formState.accessCode.trim() : "",
      })

      setCreateMessage("Room creada correctamente")
      setFormState(defaultForm)
      setIsCreateModalOpen(false)
      notifyRoomsUpdated()
      await refreshRooms({ background: true })
      // Redirect to the created room immediately
      router.push(`/watch-party?roomId=${encodeURIComponent(created.id)}`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear la room")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <FeaturePageShell
      title="Crea y explora rooms"
      description="Empieza a montar watch parties reales desde aqui. Crea una room con tu link de YouTube, revisa las salas disponibles y prepara el flujo para integraciones futuras sin salir del layout actual."
    >
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.25),transparent_35%),linear-gradient(135deg,rgba(18,18,18,0.98),rgba(10,10,12,0.93))] p-6 shadow-2xl shadow-black/25 sm:p-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-200">
              Watch party rooms
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Sube tu enlace y crea una room</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Puedo dejar esto listo para los links de YouTube que me pases: nombre de la room, link del contenido, genero y capacidad.
            </p>
          </div>
        </div>

        <section className="space-y-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Salas disponibles</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Descubrir rooms</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                {activeRooms} activas
              </span>
              <button
                type="button"
                onClick={() => {
                  setCreateMessage("")
                  setCreateError("")
                  setIsCreateModalOpen(true)
                }}
                className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Crear room
              </button>
            </div>
          </div>

          {createError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {createError}
            </div>
          ) : null}

          {createMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {createMessage}
            </div>
          ) : null}

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
              No hay rooms aun. Crea la primera con tu link de YouTube.
            </div>
          ) : null}

          {loadState === "success" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/45 to-black/25 transition hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/20"
                >
                  <div className="relative overflow-hidden border-b border-white/10 bg-black">
                    <RoomPoster contentUrl={room.contentUrl} roomName={room.name} />
                    <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-red-200 backdrop-blur">
                      {room.genres}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[11px] text-white/80 backdrop-blur">
                      {stateLabel[room.state]}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h4 className="truncate text-lg font-semibold text-white">{room.name}</h4>

                    <div className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
                      <p>Usuarios: {room.userCount}/{room.maxUsers}</p>
                      <p>Privada: {room.isPrivate ? "Si" : "No"}</p>
                      <p className="sm:col-span-2">Actualizada: {room.updatedAtLabel}</p>
                    </div>

                    <p className="mt-3 truncate text-xs text-white/45">{room.contentUrl || "Sin URL de contenido"}</p>

                    {room.isPrivate && !(backendUserId && room.userIds.includes(backendUserId)) ? (
                      <label className="mt-3 block space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/55">Codigo de acceso</span>
                        <input
                          value={joinAccessCodes[room.id] ?? ""}
                          onChange={(event) =>
                            setJoinAccessCodes((current) => ({
                              ...current,
                              [room.id]: event.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
                          placeholder="Ingresa el codigo"
                        />
                      </label>
                    ) : null}

                    <div className="mt-4">
                      {backendUserId && room.userIds.includes(backendUserId) ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/watch-party?roomId=${encodeURIComponent(room.id)}`)
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            Abrir reproductor
                          </button>
                          <button
                            type="button"
                            disabled={actionRoomId === room.id}
                            onClick={() => {
                              setConfirmLeaveRoomId(room.id)
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {actionRoomId === room.id ? "Saliendo..." : "Salir de la room"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={actionRoomId === room.id || !backendUserId}
                          onClick={() => {
                            void handleJoinRoom(room.id, room.isPrivate ? joinAccessCodes[room.id] : undefined)
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionRoomId === room.id ? "Uniendome..." : "Unirme"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {isCreateModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5 shadow-2xl shadow-black/40 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Crear room</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Nueva sala sincronizada</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                    {user?.name || "Usuario autenticado"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleCreateRoom}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-white/75">Nombre de la room</span>
                    <input
                      value={formState.name}
                      onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
                      placeholder="Ej: Marvel night / Anime Friday"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-white/75">Link de YouTube</span>
                    <input
                      value={formState.contentUrl}
                      onChange={(event) => setFormState((current) => ({ ...current, contentUrl: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white/75">Genero</span>
                    <select
                      value={formState.genres}
                      onChange={(event) => setFormState((current) => ({ ...current, genres: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-red-500/40"
                    >
                      {genreOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-white/75">Capacidad maxima</span>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={formState.maxUsers}
                      onChange={(event) => setFormState((current) => ({ ...current, maxUsers: Number(event.target.value) }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-red-500/40"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formState.isPrivate}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        isPrivate: event.target.checked,
                        accessCode: event.target.checked ? current.accessCode : "",
                      }))
                    }
                    className="h-4 w-4 rounded border-white/20 bg-transparent text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-white/75">Room privada con codigo de acceso</span>
                </label>

                {formState.isPrivate ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/75">Codigo de acceso</span>
                    <input
                      value={formState.accessCode}
                      onChange={(event) => setFormState((current) => ({ ...current, accessCode: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
                      placeholder="Codigo para invitados"
                    />
                  </label>
                ) : null}

                {createError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {createError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating ? "Creando room..." : "Crear room"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>
    </FeaturePageShell>
    <ConfirmLeaveModal
      isOpen={confirmLeaveRoomId !== ""}
      title="Salir de la sala"
      message="Vas a salir de la sala. ¿Estás seguro?"
      confirmLabel="Salir"
      cancelLabel="Cancelar"
      onConfirm={() => void handleConfirmLeave(confirmLeaveRoomId)}
      onCancel={() => setConfirmLeaveRoomId("")}
    />
    </>
  )
}
