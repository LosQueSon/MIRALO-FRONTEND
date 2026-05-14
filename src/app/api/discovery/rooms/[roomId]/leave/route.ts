import { NextRequest, NextResponse } from "next/server"

const backendBaseUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "")

const getBearerToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get("authorization")
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim()
}

const resolveBackendUserId = async (token: string): Promise<string | null> => {
  const userResponse = await fetch(`${backendBaseUrl}/users/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })

  if (!userResponse.ok) {
    return null
  }

  const payload = (await userResponse.json().catch(() => null)) as { id?: string } | null
  return typeof payload?.id === "string" ? payload.id : null
}

export async function POST(request: NextRequest, context: { params: Promise<{ roomId: string }> }) {
  const token = getBearerToken(request)
  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Token requerido" }, { status: 401 })
  }

  const { roomId } = await context.params
  const userId = await resolveBackendUserId(token)

  if (!userId) {
    return NextResponse.json({ code: "USER_RESOLVE_ERROR", message: "No fue posible resolver el usuario" }, { status: 400 })
  }

  const leaveResponse = await fetch(`${backendBaseUrl}/rooms/${roomId}/users/${userId}/leave`, {
    method: "POST",
  })

  const payload = await leaveResponse.json().catch(() => null)
  return NextResponse.json(payload, { status: leaveResponse.status })
}
