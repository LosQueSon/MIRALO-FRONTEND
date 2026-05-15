import { NextResponse, type NextRequest } from "next/server"

const backendBaseUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "")

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const token = request.headers.get("Authorization")

  if (!token) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Token requerido" },
      { status: 401 },
    )
  }

  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Cuerpo de solicitud inválido" },
      { status: 400 },
    )
  }

  const response = await fetch(`${backendBaseUrl}/rooms/${roomId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const token = request.headers.get("Authorization")

  if (!token) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Token requerido" },
      { status: 401 },
    )
  }

  const response = await fetch(`${backendBaseUrl}/rooms/${roomId}`, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
