export interface WatchPartyRoom {
  id: string
  name: string
  state: "waiting" | "active" | "finished"
  contentUrl: string
  userIds: string[]
  maxUsers: number
  hostId: string
  isPrivate?: boolean
  accessCode?: string
  genres?: string
}

export interface WatchState {
  isPlaying: boolean
  positionMs: number
  updatedBy: string
  updatedAt: string
  version: number
}

export interface WatchStateResponse {
  state: WatchState
}

export interface WatchPartyError {
  code?: string
  message: string
}

export interface SessionUserResponse {
  id: string
  name: string
}

export interface UserFavoriteGenre {
  userId: string
  favoriteGenre: string | null
}

// Re-export recommendation types
export type {
  RoomUser,
  MovieRecommendation,
  RecommendationsResponse,
  RoomPoll,
  RoomPollVote,
  PollResponse,
  RecommendationError,
} from "./recommendations"
