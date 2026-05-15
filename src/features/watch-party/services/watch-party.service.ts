import type {
  SessionUserResponse,
  UserFavoriteGenre,
  WatchPartyRoom,
  WatchState,
  WatchStateResponse,
} from "../types"
import {
  parseBackendPlaybackState,
  parseBackendRoom,
  parseBackendSessionUser,
  parseBackendUsersGenres,
} from "@/lib/contracts/backend"
import { ensureOk } from "@/lib/http/api"
import { notifyRoomsUpdated } from "@/lib/rooms-sync"

const normalizeRoom = (input: unknown): WatchPartyRoom | null => {
  const room = parseBackendRoom(input)
  if (!room) {
    return null
  }

  return {
    id: room.id,
    name: room.name,
    state: room.state,
    contentUrl: room.contentUrl,
    userIds: room.userIds,
    maxUsers: room.maxUsers,
  }
}

const parseRooms = (payload: unknown): WatchPartyRoom[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeRoom).filter((room): room is WatchPartyRoom => room !== null)
}

const normalizeWatchState = (payload: unknown): WatchState => {
  return parseBackendPlaybackState(payload)
}

export const getWatchPartyRooms = async (): Promise<WatchPartyRoom[]> => {
  const response = await fetch("/api/watch-party/rooms", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await ensureOk(response, "No fue posible cargar las salas de watch party")
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

  const payload = await ensureOk(response, "No fue posible cargar el estado de reproduccion")
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

  const payload = await ensureOk(response, "No fue posible actualizar el estado de reproduccion")
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

  const payload = await ensureOk(response, "No fue posible resolver el usuario de sesion")
  const sessionUser = parseBackendSessionUser(payload)

  if (!sessionUser) {
    throw new Error("No se recibio un id de usuario valido")
  }

  return {
    id: sessionUser.id,
    name: sessionUser.name,
  }
}

export const joinWatchPartyRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response, "No fue posible unirte a la sala")
  notifyRoomsUpdated()
}

export const leaveWatchPartyRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response, "No fue posible salir de la sala")
  notifyRoomsUpdated()
}

export const getUsersFavoriteGenres = async (roomId: string): Promise<UserFavoriteGenre[]> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/users/genres`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await ensureOk(response, "No fue posible consultar los generos de los participantes")
  return parseBackendUsersGenres(payload)
}
