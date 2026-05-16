"use client"

import { useCallback, useEffect, useState } from "react"
import type { MovieRecommendation, RecommendationError, RecommendationsResponse, RoomUser } from "../types"
import { getRoomRecommendations, checkMotorHealth } from "../services/recommendations.service"

interface RecommendationsBlockProps {
  roomUsers: RoomUser[]
  onCreatePoll?: () => void
  pollingIntervalMs?: number
}

const StarIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none" stroke="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      strokeWidth="2"
      strokeLinecap="round"
    />
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

export const RecommendationsBlock = ({
  roomUsers,
  onCreatePoll,
  pollingIntervalMs = 30000,
}: RecommendationsBlockProps) => {
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<RecommendationError | null>(null)
  const [motorAvailable, setMotorAvailable] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchRecommendations = useCallback(async () => {
    if (!roomUsers || roomUsers.length === 0) {
      setRecommendations([])
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const response: RecommendationsResponse = await getRoomRecommendations(roomUsers, 5)

      if (response.recommendations && response.recommendations.length > 0) {
        setRecommendations(response.recommendations.slice(0, 3))
        setMotorAvailable(true)
      }
      setLastUpdated(new Date())
    } catch (err) {
      const recError = err as RecommendationError
      setError(recError)
      setMotorAvailable(false)
      console.warn("Error fetching recommendations:", recError.message)
    } finally {
      setIsLoading(false)
    }
  }, [roomUsers])

  // Initial fetch
  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Polling mechanism
  useEffect(() => {
    if (!motorAvailable || pollingIntervalMs <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchRecommendations()
    }, pollingIntervalMs)

    return () => clearInterval(interval)
  }, [motorAvailable, pollingIntervalMs, fetchRecommendations])

  if (!motorAvailable && error) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 shadow-sm">
        <div className="flex gap-3">
          <AlertIcon className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Motor de recomendaciones no disponible</h3>
            <p className="mt-1 text-xs text-white/70">{error.message}</p>
            <p className="mt-2 text-xs text-white/50">
              La sala continúa funcionando normalmente. El motor se reintentará automáticamente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Recomendaciones</p>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-white leading-tight">Recomendaciones del grupo</h3>
            {isLoading && <SpinnerIcon className="h-4 w-4 text-red-400" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[11px] leading-tight text-white/45 text-right">
              Actualizado {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s atrás
            </span>
          )}
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="rounded-md border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar recomendaciones"
          >
            <RefreshIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <SpinnerIcon className="h-5 w-5 text-red-400" />
              <p className="text-xs text-white/60">Cargando recomendaciones...</p>
            </div>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={rec.movieId} className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10">
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-xs font-semibold text-red-200 border border-red-500/30">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-white">{rec.title}</h4>
                    <p className="mt-0.5 text-xs text-white/55 break-words">
                      {rec.type === "movie" ? "Película" : "Serie"} • {rec.genres.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-2 ml-8 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(rec.consensus_score * 5) ? "text-yellow-400" : "text-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-white/80">{(rec.consensus_score * 100).toFixed(0)}%</span>
                  </div>

                  {rec.reasons && rec.reasons.length > 0 && (
                    <div className="text-xs text-white/60">
                      {rec.reasons.map((reason, i) => (
                        <p key={i} className="leading-relaxed">
                          • {reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-white/50 text-center">No hay recomendaciones disponibles en este momento</p>
          </div>
        )}
      </div>

      {recommendations.length > 0 && onCreatePoll && (
        <button
          onClick={onCreatePoll}
          className="mt-3 w-full rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          Crear votación
        </button>
      )}
    </div>
  )
}
