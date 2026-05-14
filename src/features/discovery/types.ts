export type RoomState = "waiting" | "active" | "finished"

export interface DiscoveryRoom {
  id: string
  name: string
  state: RoomState
  isPrivate: boolean
  maxUsers: number
  userCount: number
  userIds: string[]
  genres: string
  contentUrl: string
  updatedAtLabel: string
}

export interface DiscoverySessionUser {
  id: string
  name: string
  email: string
}

export interface DiscoveryRoomCreatePayload {
  name: string
  isPrivate: boolean
  accessCode: string
  maxUsers: number
  genres: string
  contentUrl: string
  hostId?: string
}

export interface DiscoveryRoomsResponse {
  rooms: DiscoveryRoom[]
}
