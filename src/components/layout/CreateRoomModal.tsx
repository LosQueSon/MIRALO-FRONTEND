"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { createDiscoveryRoom } from "@/features/discovery/services/rooms.service"

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

const defaultForm = {
  name: "",
  contentUrl: "",
  genres: "comedy",
  maxUsers: 8,
  isPrivate: false,
  accessCode: "",
}

export default function CreateRoomModal() {
  const router = useRouter()
  const isOpen = useAuthStore((state) => state.isCreateRoomModalOpen)
  const closeModal = useAuthStore((state) => state.closeCreateRoomModal)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formState, setFormState] = useState(defaultForm)

  const handleClose = () => {
    setMessage("")
    setError("")
    setFormState(defaultForm)
    closeModal()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name.trim() || !formState.contentUrl.trim()) {
      setError("Completa el nombre y el enlace de YouTube")
      return
    }

    setIsCreating(true)
    setError("")
    setMessage("")

    try {
      await createDiscoveryRoom({
        name: formState.name.trim(),
        contentUrl: formState.contentUrl.trim(),
        genres: formState.genres,
        maxUsers: Number(formState.maxUsers),
        isPrivate: formState.isPrivate,
        accessCode: formState.isPrivate ? formState.accessCode.trim() : "",
      })

      window.dispatchEvent(new Event("miralo:rooms-updated"))
      setMessage("Sala creada correctamente")
      handleClose()
      router.refresh()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear la sala")
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Crear sala</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Nueva sala sincronizada</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-white/75">Nombre de la sala</span>
              <input
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/40"
                placeholder="Ej: Noche de peliculas"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-white/75">Enlace de YouTube</span>
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
            <span className="text-sm text-white/75">Sala privada con codigo de acceso</span>
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

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? "Creando sala..." : "Crear sala"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
