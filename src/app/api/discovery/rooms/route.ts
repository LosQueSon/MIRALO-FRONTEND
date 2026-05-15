import { NextRequest, NextResponse } from "next/server"

const backendBaseUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "")

export async function GET() {
  const response = await fetch(`${backendBaseUrl}/rooms`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

  if (!body) {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "El cuerpo de la solicitud no es valido" },
      { status: 400 },
    )
  }

  if (typeof body.hostId !== "string" || body.hostId.trim().length === 0) {
    return NextResponse.json(
      { code: "INVALID_HOST_ID", message: "El hostId es obligatorio para crear la sala" },
      { status: 400 },
    )
  }

  const payload = {
    ...body,
    hostId: body.hostId,
  }

  const response = await fetch(`${backendBaseUrl}/rooms/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  return NextResponse.json(data, { status: response.status })
}
