"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import { getRoomRecommendations } from "../services/recommendations.service"
import type { MovieRecommendation, RecommendationError, RoomPoll, RoomUser } from "../types"
import { PollWidget } from "./PollWidget"

interface RecommendationsModalProps {
  isOpen: boolean
  roomUsers: RoomUser[]
  activePollId: string | null
  isCreatingPoll: boolean
  onCreatePoll: () => Promise<RoomPoll | null>
  currentUserId: string
  onClose: () => void
}

const StarIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const AlertIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const RefreshIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

export const RecommendationsModal = ({
  isOpen,
  roomUsers,
  activePollId,
  isCreatingPoll,
  onCreatePoll,
  currentUserId,
  onClose,
}: RecommendationsModalProps) => {
  const [mounted, setMounted] = useState(false)
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<RecommendationError | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasUsers = roomUsers.length > 0

  const fetchRecommendations = useCallback(async () => {
    if (!hasUsers) {
      setRecommendations([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await getRoomRecommendations(roomUsers, 5)
      setRecommendations(response.recommendations.slice(0, 3))
      setLastUpdated(new Date())
    } catch (fetchError) {
      setError(fetchError as RecommendationError)
    } finally {
      setIsLoading(false)
    }
  }, [hasUsers, roomUsers])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void fetchRecommendations()
  }, [fetchRecommendations, isOpen])

  const statusText = useMemo(() => {
    if (!hasUsers) {
      return "Se necesitan participantes para generar recomendaciones"
    }

    return "Recomendaciones del motor para la sala actual"
  }, [hasUsers])

  const handleCreatePoll = useCallback(async () => {
    try {
      await onCreatePoll()
    } catch (pollError) {
      setError(pollError as RecommendationError)
    }
  }, [onCreatePoll])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0d] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Motor de recomendaciones</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Recomendaciones del grupo</h3>
            <p className="mt-1 text-sm text-white/55">{statusText}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/45">
            {isLoading ? <SpinnerIcon className="h-4 w-4 text-red-400" /> : <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />}
            <span>{isLoading ? "Actualizando" : "Listo"}</span>
            {lastUpdated ? <span>• {lastUpdated.toLocaleTimeString("es-CO")}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => void fetchRecommendations()}
            disabled={isLoading || !hasUsers}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Actualizar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {!hasUsers ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
              No hay participantes suficientes para generar recomendaciones.
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertIcon className="h-5 w-5 flex-shrink-0 text-red-300" />
                <div>
                  <h4 className="text-sm font-semibold text-white">No fue posible cargar las recomendaciones</h4>
                  <p className="mt-1 text-xs text-white/70">{error.message}</p>
                </div>
              </div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
              No hay recomendaciones disponibles en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={rec.movieId} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-600/15 text-xs font-semibold text-red-200">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                      <p className="mt-0.5 break-words text-xs text-white/55">
                        {rec.type === "movie" ? "Película" : "Serie"} • {rec.genres.join(", ")}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, starIndex) => (
                            <StarIcon
                              key={starIndex}
                              className={`h-3.5 w-3.5 ${starIndex < Math.round(rec.consensus_score * 5) ? "text-yellow-400" : "text-white/20"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-white/80">{(rec.consensus_score * 100).toFixed(0)}%</span>
                      </div>

                      {rec.reasons.length > 0 && (
                        <div className="mt-2 text-xs text-white/60">
                          {rec.reasons.map((reason, reasonIndex) => (
                            <p key={reasonIndex} className="leading-relaxed">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasUsers && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Votación</p>
                  <h4 className="mt-1 text-sm font-semibold text-white">Encuesta del grupo</h4>
                  <p className="mt-1 text-xs text-white/55">Crea una encuesta a partir de las recomendaciones actuales y deja que la sala elija.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCreatePoll()}
                  disabled={isCreatingPoll}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPoll ? "Creando..." : activePollId ? "Crear nueva votación" : "Crear votación"}
                </button>
              </div>

              {activePollId ? (
                <PollWidget pollId={activePollId} userId={currentUserId} />
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/55">
                  Todavía no hay una encuesta activa. Pulsa <span className="font-semibold text-white">Crear votación</span> para iniciar el flujo.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}