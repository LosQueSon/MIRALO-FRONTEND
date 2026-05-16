/**
 * Tipos para integración con el Motor de Recomendaciones
 * @see PLAN_INTEGRACION_MOTOR_RECOMENDACIONES.md
 */

export interface RoomUser {
  userId: string
  favoriteGenre?: string | null
  favoriteGenres?: string[]
}

export interface MovieRecommendation {
  movieId: number
  title: string
  genres: string[]
  type: "movie" | "series"
  consensus_score: number
  reasons: string[]
  voteCount?: number
}

export interface RecommendationsResponse {
  recommendationCount?: number
  recommendations: MovieRecommendation[]
  consensus_score?: number
  reasons?: string[]
}

export interface RoomPoll {
  pollId: string
  createdAt: string
  totalUsers: number
  votesCast: number
  options: MovieRecommendation[]
  winner?: MovieRecommendation | null
  status?: "active" | "expired" | "closed"
  votes?: Record<string, number>
  userVotes?: Record<string, number>
  expiresAt?: string
}

export interface RoomPollVote {
  userId: string
  movieId: number
}

export interface PollResponse {
  pollId: string
  createdAt?: string
  totalUsers: number
  votesCast: number
  options: MovieRecommendation[]
  winner?: MovieRecommendation | null
  status?: "active" | "expired" | "closed"
  votes?: Record<string, number>
  userVotes?: Record<string, number>
  expiresAt?: string
}

export interface RecommendationError {
  code: string
  message: string
  details?: Record<string, unknown>
}
