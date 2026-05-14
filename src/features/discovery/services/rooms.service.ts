import {
  DiscoveryRoom,
  DiscoveryRoomCreatePayload,
  DiscoveryRoomsResponse,
  DiscoverySessionUser,
  RoomState,
} from "@/features/discovery/types"

const backendBaseUrl = "/api/discovery/rooms"

const ensureState = (value: unknown): RoomState => {
  if (value === "waiting" || value === "active" || value === "finished") {
    return value
  }

  return "waiting"
}

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
  if (!input || typeof input !== "object") {
    return null
  }

  const source = input as Record<string, unknown>
  const id = typeof source.id === "string" ? source.id : ""
  const name = typeof source.name === "string" ? source.name : "Sala sin nombre"

  if (!id) {
    return null
  }

  const userIds = Array.isArray(source.userIds)
    ? source.userIds.filter((item): item is string => typeof item === "string")
    : []

  return {
    id,
    name,
    state: ensureState(source.state),
    isPrivate: Boolean(source.isPrivate),
    maxUsers: typeof source.maxUsers === "number" ? source.maxUsers : 0,
    userCount: userIds.length,
    userIds,
    genres: typeof source.genres === "string" ? source.genres : "other",
    contentUrl: typeof source.contentUrl === "string" ? source.contentUrl : "",
    updatedAtLabel: toDateLabel(source.updatedAt),
  }
}

const parseRooms = (payload: unknown): DiscoveryRoom[] => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeRoom).filter((room): room is DiscoveryRoom => room !== null)
}

export const getDiscoveryRooms = async (): Promise<DiscoveryRoomsResponse> => {
  const response = await fetch(backendBaseUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("No fue posible consultar las salas en este momento")
  }

  return { rooms: parseRooms((await response.json()) as unknown) }
}

export const createDiscoveryRoom = async (payload: DiscoveryRoomCreatePayload): Promise<DiscoveryRoom> => {
  const response = await fetch(backendBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorPayload?.message || "No fue posible crear la room")
  }

  const room = normalizeRoom((await response.json()) as unknown)
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

  if (!response.ok) {
    throw new Error("No fue posible resolver el usuario de sesion")
  }

  const payload = (await response.json()) as Record<string, unknown>
  const id = typeof payload.id === "string" ? payload.id : ""
  const name = typeof payload.name === "string" ? payload.name : ""
  const email = typeof payload.email === "string" ? payload.email : ""

  if (!id) {
    throw new Error("No se recibio un id de usuario valido")
  }

  return { id, name, email }
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

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message || "No fue posible unirse a la room")
  }
}

export const leaveDiscoveryRoom = async (roomId: string, token: string): Promise<void> => {
  const response = await fetch(`/api/discovery/rooms/${roomId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(payload?.message || "No fue posible salir de la room")
  }
}
