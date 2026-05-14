import { NextRequest, NextResponse } from "next/server"

const backendBaseUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "")

const getBearerToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get("authorization")
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim()
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request)

  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Token requerido" }, { status: 401 })
  }

  const response = await fetch(`${backendBaseUrl}/users/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
