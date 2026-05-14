import type {
  SessionUserResponse,
  WatchPartyError,
  WatchPartyRoom,
  WatchState,
  WatchStateResponse,
} from "../types"

const ensureOk = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response
  }

  const payload = (await response.json().catch(() => null)) as WatchPartyError | null
  const message = payload?.message ?? `Request failed with status ${response.status}`
  throw new Error(message)
}

const normalizeRoom = (input: unknown): WatchPartyRoom | null => {
  if (!input || typeof input !== "object") {
    return null
  }

  const source = input as Record<string, unknown>
  const id = typeof source.id === "string" ? source.id : ""
  if (!id) {
    return null
  }

  const rawState = source.state
  const state = rawState === "active" || rawState === "finished" ? rawState : "waiting"
  const userIds = Array.isArray(source.userIds)
    ? source.userIds.filter((item): item is string => typeof item === "string")
    : []

  return {
    id,
    name: typeof source.name === "string" ? source.name : "Sala sin nombre",
    state,
    contentUrl: typeof source.contentUrl === "string" ? source.contentUrl : "",
    userIds,
    maxUsers: typeof source.maxUsers === "number" ? source.maxUsers : 0,
  }
}

const parseRooms = (payload: unknown): WatchPartyRoom[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeRoom).filter((room): room is WatchPartyRoom => room !== null)
}

const normalizeWatchState = (payload: unknown): WatchState => {
  const source = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {}

  return {
    isPlaying: Boolean(source.isPlaying),
    positionMs: typeof source.positionMs === "number" ? source.positionMs : 0,
    updatedBy: typeof source.updatedBy === "string" ? source.updatedBy : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date(0).toISOString(),
    version: typeof source.version === "number" ? source.version : 0,
  }
}

export const getWatchPartyRooms = async (): Promise<WatchPartyRoom[]> => {
  const response = await fetch("/api/watch-party/rooms", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const okResponse = await ensureOk(response)
  const payload = (await okResponse.json()) as unknown
  return parseRooms(payload)
}

export const getWatchState = async (roomId: string): Promise<WatchStateResponse> => {
  const response = await fetch(`/api/watch-party/state/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const okResponse = await ensureOk(response)
  const payload = (await okResponse.json()) as unknown
  return {
    state: normalizeWatchState(payload),
  }
}

export const patchWatchState = async (
  roomId: string,
  action: "play" | "pause" | "seek",
  positionMs: number,
  token: string,
): Promise<WatchStateResponse> => {
  const response = await fetch(`/api/watch-party/state/${roomId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, positionMs }),
  })

  const okResponse = await ensureOk(response)
  const payload = (await okResponse.json()) as unknown
  return {
    state: normalizeWatchState(payload),
  }
}

export const resolveSessionUser = async (token: string): Promise<SessionUserResponse> => {
  const response = await fetch("/api/discovery/session-user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  const okResponse = await ensureOk(response)
  return (await okResponse.json()) as SessionUserResponse
}

export const joinWatchPartyRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response)
}

export const leaveWatchPartyRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response)
}
