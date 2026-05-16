"use client"

import { useCallback, useEffect, useState } from "react"
import type { PollResponse, RecommendationError, RoomPollVote } from "../types"
import { getPollStatus, submitPollVote } from "../services/recommendations.service"

interface PollWidgetProps {
  pollId: string
  userId: string
  pollingIntervalMs?: number
  onPollClosed?: () => void
}

const CheckIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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

const TrophyIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z" />
  </svg>
)

export const PollWidget = ({
  pollId,
  userId,
  pollingIntervalMs = 5000,
  onPollClosed,
}: PollWidgetProps) => {
  const [poll, setPoll] = useState<PollResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<RecommendationError | null>(null)
  const [userVoted, setUserVoted] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)

  const fetchPollStatus = useCallback(async () => {
    try {
      setError(null)
      const pollData = await getPollStatus(pollId)
      setPoll(pollData)

      if (selectedMovieId !== null) {
        setUserVoted(true)
      }

      const totalVotes = pollData.votesCast ?? pollData.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0)
      if (pollData.totalUsers > 0 && totalVotes >= pollData.totalUsers) {
        onPollClosed?.()
      }
    } catch (err) {
      const recError = err as RecommendationError
      setError(recError)
      console.warn("Error fetching poll status:", recError.message)
    } finally {
      setIsLoading(false)
    }
  }, [pollId, onPollClosed, selectedMovieId])

  // Initial fetch
  useEffect(() => {
    fetchPollStatus()
  }, [fetchPollStatus])

  // Polling mechanism
  useEffect(() => {
    const totalVotes = poll?.votesCast ?? poll?.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0) ?? 0
    const isComplete = Boolean(poll && poll.totalUsers > 0 && totalVotes >= poll.totalUsers)

    if (!poll || isComplete || pollingIntervalMs <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchPollStatus()
    }, pollingIntervalMs)

    return () => clearInterval(interval)
  }, [poll, pollingIntervalMs, fetchPollStatus])

  const handleVote = async (movieId: number) => {
    if (userVoted || isVoting || !poll) {
      return
    }

    setIsVoting(true)
    try {
      const vote: RoomPollVote = { userId, movieId }
      const updatedPoll = await submitPollVote(pollId, vote)
      setPoll(updatedPoll)
      setUserVoted(true)
      setSelectedMovieId(movieId)
      setError(null)
    } catch (err) {
      const recError = err as RecommendationError
      setError(recError)
      console.error("Error submitting vote:", recError.message)
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4">
        <div className="flex items-center justify-center gap-2 py-2">
          <SpinnerIcon className="h-5 w-5 text-red-400" />
          <p className="text-sm text-white/70">Cargando encuesta...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4">
        <div className="flex gap-3">
          <AlertIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Error en la encuesta</h3>
            <p className="mt-1 text-xs text-white/70">{error?.message || "No se pudo cargar la encuesta"}</p>
          </div>
        </div>
      </div>
    )
  }

  const totalVotesCount = poll.votesCast ?? poll.options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0)
  const isComplete = poll.totalUsers > 0 && totalVotesCount >= poll.totalUsers
  const winnerMovieId = poll.winner?.movieId ?? null

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Votación</p>
          <h3 className="mt-1 text-lg font-bold text-white leading-tight">
            {isComplete ? "Resultados de la votación" : "Votación de sala"}
          </h3>
          <p className="mt-1 text-xs text-white/55">
            {totalVotesCount} de {poll.totalUsers} votos emitidos
          </p>
          {userVoted && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-300">
              <CheckIcon className="h-3 w-3" />
              Voto registrado en esta sesión
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isComplete
              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {isComplete ? "Completa" : "En progreso"}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {poll.options?.map((option) => {
          const votes = option.voteCount || 0
          const votePercentage = totalVotesCount > 0 ? (votes / totalVotesCount) * 100 : 0
          const isWinner = winnerMovieId === option.movieId
          const userVotedThis = selectedMovieId === option.movieId

          return (
            <button
              key={option.movieId}
              onClick={() => handleVote(option.movieId)}
              disabled={userVoted || isComplete || isVoting}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                userVotedThis
                  ? "border-red-500/40 bg-red-500/10 ring-1 ring-red-500/30"
                  : isWinner && isComplete
                    ? "border-amber-400/40 bg-amber-400/10 ring-1 ring-amber-400/30"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              } ${
                (userVoted || isComplete || isVoting) && !userVotedThis && !isWinner
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{option.title}</h4>
                      <p className="text-xs text-white/55 break-words">{option.genres.join(", ")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Vote bar */}
                  <div className="flex flex-col items-end">
                    <div className="h-6 w-12 overflow-hidden rounded bg-white/10">
                      <div
                        className={`h-full rounded transition-all ${
                          userVotedThis
                            ? "bg-red-500"
                            : isWinner
                              ? "bg-amber-400"
                              : "bg-sky-400"
                        }`}
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-white/75">{votes} voto{votes !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Status icon */}
                  {userVotedThis && <CheckIcon className="h-5 w-5 text-red-400 flex-shrink-0" />}
                  {isWinner && isComplete && <TrophyIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />}
                  {isVoting && !isComplete && <SpinnerIcon className="h-5 w-5 text-white/70 flex-shrink-0" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="text-xs text-white/60">
          <span className="font-semibold">{totalVotesCount}</span> voto{totalVotesCount !== 1 ? "s" : ""} •{" "}
          {poll.options?.length || 0} opciones
        </p>
      </div>

      {winnerMovieId && isComplete && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-white">¡Ganador!</p>
              <p className="text-xs text-white/70">
                {poll.winner?.title || poll.options?.find((o) => o.movieId === winnerMovieId)?.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
