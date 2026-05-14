export interface WatchPartyRoom {
  id: string
  name: string
  state: "waiting" | "active" | "finished"
  contentUrl: string
  userIds: string[]
  maxUsers: number
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
