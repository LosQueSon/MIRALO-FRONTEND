/**
 * Servicio para consumir el API del Motor de Recomendaciones
 * Endpoint: NEXT_PUBLIC_RECOMMENDATIONS_MOTOR_URL (por defecto http://localhost:3000)
 */

import type {
  MovieRecommendation,
  PollResponse,
  RecommendationError,
  RecommendationsResponse,
  RoomPoll,
  RoomPollVote,
  RoomUser,
} from "../types"

const MOTOR_URL = process.env.NEXT_PUBLIC_RECOMMENDATIONS_MOTOR_URL || "http://localhost:3000"
const REQUEST_TIMEOUT_MS = 5000

const GENRE_LABELS: Record<string, string> = {
  action: "Action",
  adventure: "Adventure",
  animation: "Animation",
  comedy: "Comedy",
  crime: "Crime",
  drama: "Drama",
  fantasy: "Fantasy",
  horror: "Horror",
  mystery: "Mystery",
  romance: "Romance",
  "sci-fi": "Sci-Fi",
  thriller: "Thriller",
  musical: "Musical",
  western: "Western",
}

const normalizeGenre = (genre?: string | null): string | null => {
  if (!genre) {
    return null
  }

  const normalized = genre.trim().toLowerCase()
  if (!normalized || normalized === "other") {
    return null
  }

  return GENRE_LABELS[normalized] ?? normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const normalizeRoomUsers = (users: RoomUser[]): RoomUser[] => {
  return users
    .map((user) => ({
      userId: user.userId,
      favoriteGenre: normalizeGenre(user.favoriteGenre),
      favoriteGenres: Array.isArray(user.favoriteGenres)
        ? user.favoriteGenres.map((genre) => normalizeGenre(genre)).filter((genre): genre is string => Boolean(genre))
        : undefined,
    }))
    .filter((user) => Boolean(user.userId))
}

/**
 * Crea un AbortSignal con timeout para las request al motor
 */
const createTimeoutSignal = (): AbortSignal => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return controller.signal
}

/**
 * Parsea la respuesta del motor y maneja errores
 */
const parseMotorResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: RecommendationError = {
      code: `HTTP_${response.status}`,
      message: `Error del Motor de Recomendaciones: ${response.statusText}`,
    }
    throw error
  }

  try {
    return (await response.json()) as T
  } catch {
    const error: RecommendationError = {
      code: "PARSE_ERROR",
      message: "No se pudo parsear la respuesta del Motor de Recomendaciones",
    }
    throw error
  }
}

/**
 * Verifica la salud del Motor de Recomendaciones
 */
export const checkMotorHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${MOTOR_URL}/health`, {
      method: "GET",
      signal: createTimeoutSignal(),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Obtiene recomendaciones para una sala basadas en los géneros favoritos de los usuarios
 * @param users - Lista de usuarios de la sala con sus géneros favoritos
 * @param topK - Cantidad de recomendaciones a devolver (default: 10, max: 50)
 */
export const getRoomRecommendations = async (
  users: RoomUser[],
  topK: number = 10,
): Promise<RecommendationsResponse> => {
  if (!users || users.length === 0) {
    return {
      recommendationCount: 0,
      recommendations: [],
      consensus_score: 0,
    }
  }

  try {
    const payload = {
      users: normalizeRoomUsers(users),
      topK: Math.min(topK, 50),
    }

    const response = await fetch(`${MOTOR_URL}/recommendations/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: createTimeoutSignal(),
    })

    return await parseMotorResponse<RecommendationsResponse>(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const timeoutError: RecommendationError = {
          code: "TIMEOUT",
          message: `El Motor de Recomendaciones no respondió en ${REQUEST_TIMEOUT_MS}ms`,
        }
        throw timeoutError
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      throw error
    }

    const networkError: RecommendationError = {
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el Motor de Recomendaciones",
    }
    throw networkError
  }
}

/**
 * Crea una encuesta (poll) con las 3 mejores recomendaciones para la sala
 * @param users - Lista de usuarios de la sala
 */
export const createRoomPoll = async (users: RoomUser[]): Promise<RoomPoll> => {
  if (!users || users.length === 0) {
    const error: RecommendationError = {
      code: "INVALID_USERS",
      message: "Se requiere al menos un usuario para crear una encuesta",
    }
    throw error
  }

  try {
    const payload = {
      users: normalizeRoomUsers(users),
    }

    const response = await fetch(`${MOTOR_URL}/recommendations/room/poll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: createTimeoutSignal(),
    })

    return await parseMotorResponse<RoomPoll>(response)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError: RecommendationError = {
        code: "TIMEOUT",
        message: `El Motor de Recomendaciones no respondió en ${REQUEST_TIMEOUT_MS}ms`,
      }
      throw timeoutError
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      throw error
    }

    const networkError: RecommendationError = {
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el Motor de Recomendaciones",
    }
    throw networkError
  }
}

/**
 * Obtiene el estado actual de una encuesta
 * @param pollId - ID de la encuesta
 */
export const getPollStatus = async (pollId: string): Promise<PollResponse> => {
  if (!pollId || pollId.trim() === "") {
    const error: RecommendationError = {
      code: "INVALID_POLL_ID",
      message: "El ID de la encuesta no puede estar vacío",
    }
    throw error
  }

  try {
    const response = await fetch(`${MOTOR_URL}/recommendations/room/poll/${pollId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: createTimeoutSignal(),
    })

    return await parseMotorResponse<PollResponse>(response)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError: RecommendationError = {
        code: "TIMEOUT",
        message: `El Motor de Recomendaciones no respondió en ${REQUEST_TIMEOUT_MS}ms`,
      }
      throw timeoutError
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      throw error
    }

    const networkError: RecommendationError = {
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el Motor de Recomendaciones",
    }
    throw networkError
  }
}

/**
 * Registra un voto en una encuesta
 * @param pollId - ID de la encuesta
 * @param vote - Voto con userId y movieId
 */
export const submitPollVote = async (pollId: string, vote: RoomPollVote): Promise<PollResponse> => {
  if (!pollId || pollId.trim() === "") {
    const error: RecommendationError = {
      code: "INVALID_POLL_ID",
      message: "El ID de la encuesta no puede estar vacío",
    }
    throw error
  }

  if (!vote.userId || !vote.movieId) {
    const error: RecommendationError = {
      code: "INVALID_VOTE",
      message: "El voto debe incluir userId y movieId",
    }
    throw error
  }

  try {
    const response = await fetch(`${MOTOR_URL}/recommendations/room/poll/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: vote.userId,
        movieId: vote.movieId,
      }),
      signal: createTimeoutSignal(),
    })

    return await parseMotorResponse<PollResponse>(response)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError: RecommendationError = {
        code: "TIMEOUT",
        message: `El Motor de Recomendaciones no respondió en ${REQUEST_TIMEOUT_MS}ms`,
      }
      throw timeoutError
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      throw error
    }

    const networkError: RecommendationError = {
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el Motor de Recomendaciones",
    }
    throw networkError
  }
}
