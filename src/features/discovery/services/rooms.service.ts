import {
  DiscoveryRoom,
  DiscoveryRoomCreatePayload,
  DiscoveryRoomsResponse,
  DiscoverySessionUser,
} from "@/features/discovery/types"
import { parseBackendRoom, parseBackendRooms, parseBackendSessionUser } from "@/lib/contracts/backend"
import { ensureOk } from "@/lib/http/api"

const backendBaseUrl = "/api/discovery/rooms"

const toDateLabel = (value: unknown): string => {
  if (typeof value !== "string") {
    return "Sin fecha"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha"
  }

  return parsed.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const normalizeRoom = (input: unknown): DiscoveryRoom | null => {
  const room = parseBackendRoom(input)
  if (!room) {
    return null
  }

  return {
    id: room.id,
    name: room.name,
    state: room.state,
    isPrivate: room.isPrivate,
    maxUsers: room.maxUsers,
    userCount: room.userIds.length,
    userIds: room.userIds,
    genres: room.genres,
    contentUrl: room.contentUrl,
    updatedAtLabel: toDateLabel(room.updatedAt),
  }
}

const parseRooms = (payload: unknown): DiscoveryRoom[] => {
  return parseBackendRooms(payload).map(normalizeRoom).filter((room): room is DiscoveryRoom => room !== null)
}

export const getDiscoveryRooms = async (): Promise<DiscoveryRoomsResponse> => {
  const response = await fetch(backendBaseUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await ensureOk(response, "No fue posible consultar las salas en este momento")
  return { rooms: parseRooms(payload) }
}

export const createDiscoveryRoom = async (payload: DiscoveryRoomCreatePayload): Promise<DiscoveryRoom> => {
  const response = await fetch(backendBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responsePayload = await ensureOk(response, "No fue posible crear la room")
  const room = normalizeRoom(responsePayload)
  if (!room) {
    throw new Error("La room fue creada pero no pudo normalizarse la respuesta")
  }

  return room
}

export const getDiscoverySessionUser = async (token: string): Promise<DiscoverySessionUser> => {
  const response = await fetch("/api/discovery/session-user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  const payload = await ensureOk(response, "No fue posible resolver el usuario de sesion")
  const sessionUser = parseBackendSessionUser(payload)

  if (!sessionUser) {
    throw new Error("No se recibio un id de usuario valido")
  }

  return { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email }
}

export const joinDiscoveryRoom = async (roomId: string, token: string, accessCode?: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accessCode: accessCode ?? "" }),
  })

  await ensureOk(response, "No fue posible unirse a la room")
}

export const leaveDiscoveryRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response, "No fue posible salir de la room")
}
