export type BackendRoomState = "waiting" | "active" | "finished"

export interface BackendApiError {
  code?: string
  message?: string
}

export interface BackendPlaybackState {
  isPlaying: boolean
  positionMs: number
  updatedBy: string
  updatedAt: string
  version: number
}

export interface BackendRoom {
  id: string
  name: string
  state: BackendRoomState
  isPrivate: boolean
  maxUsers: number
  hostId: string
  userIds: string[]
  genres: string
  contentUrl: string
  updatedAt: string
  playback: BackendPlaybackState
}

export interface BackendSessionUser {
  id: string
  name: string
  email: string
}

export interface BackendUserFavoriteGenre {
  userId: string
  favoriteGenre: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object"
}

const parseRoomState = (value: unknown): BackendRoomState => {
  if (value === "active" || value === "finished") {
    return value
  }

  return "waiting"
}

const parsePlaybackState = (value: unknown): BackendPlaybackState => {
  const source = isRecord(value) ? value : {}

  return {
    isPlaying: Boolean(source.isPlaying),
    positionMs: typeof source.positionMs === "number" ? source.positionMs : 0,
    updatedBy: typeof source.updatedBy === "string" ? source.updatedBy : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date(0).toISOString(),
    version: typeof source.version === "number" ? source.version : 0,
  }
}

export const parseBackendRoom = (input: unknown): BackendRoom | null => {
  if (!isRecord(input)) {
    return null
  }

  const id = typeof input.id === "string" ? input.id : ""
  if (!id) {
    return null
  }

  const userIds = Array.isArray(input.userIds)
    ? input.userIds.filter((value): value is string => typeof value === "string")
    : []

  return {
    id,
    name: typeof input.name === "string" ? input.name : "Sala sin nombre",
    state: parseRoomState(input.state),
    isPrivate: Boolean(input.isPrivate),
    maxUsers: typeof input.maxUsers === "number" ? input.maxUsers : 0,
    hostId: typeof input.hostId === "string" ? input.hostId : "",
    userIds,
    genres: typeof input.genres === "string" ? input.genres : "other",
    contentUrl: typeof input.contentUrl === "string" ? input.contentUrl : "",
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : "",
    playback: parsePlaybackState(input.playback),
  }
}

export const parseBackendRooms = (payload: unknown): BackendRoom[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(parseBackendRoom).filter((room): room is BackendRoom => room !== null)
}

export const parseBackendPlaybackState = (payload: unknown): BackendPlaybackState => {
  return parsePlaybackState(payload)
}

export const parseBackendSessionUser = (payload: unknown): BackendSessionUser | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = typeof payload.id === "string" ? payload.id : ""
  if (!id) {
    return null
  }

  return {
    id,
    name: typeof payload.name === "string" ? payload.name : "",
    email: typeof payload.email === "string" ? payload.email : "",
  }
}

export const parseBackendUsersGenres = (payload: unknown): BackendUserFavoriteGenre[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      if (!isRecord(item) || typeof item.userId !== "string") {
        return null
      }

      return {
        userId: item.userId,
        favoriteGenre: typeof item.favoriteGenre === "string" ? item.favoriteGenre : null,
      }
    })
    .filter((item): item is BackendUserFavoriteGenre => item !== null)
}
