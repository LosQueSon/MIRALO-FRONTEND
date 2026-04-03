import { AuthResponse } from "../types"

const gatewayBaseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "")

const getGatewayBaseUrl = (): string => {
  if (!gatewayBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_GATEWAY_URL configuration")
  }

  return gatewayBaseUrl
}

export const getGoogleLoginUrl = (): string => {
  return `${getGatewayBaseUrl()}/auth/google`
}

const normalizeAuthUser = (payload: unknown): AuthResponse["user"] => {
  const source = typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {}

  const id = typeof source.id === "string"
    ? source.id
    : typeof source.sub === "string"
      ? source.sub
      : ""

  const email = typeof source.email === "string" ? source.email : ""
  const name = typeof source.name === "string" && source.name.trim().length > 0
    ? source.name
    : email

  return { id, email, name }
}

export const authWithGoogle = async (token: string): Promise<AuthResponse> => {
  const response = await fetch(`${getGatewayBaseUrl()}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  })

  if (!response.ok) {
    const message = response.status === 401
      ? "Authentication token is invalid or expired"
      : "Unable to validate user session"
    throw new Error(message)
  }

  const data = (await response.json()) as Record<string, unknown>
  const userPayload = data.user ?? data

  return {
    token,
    user: normalizeAuthUser(userPayload),
  }
}