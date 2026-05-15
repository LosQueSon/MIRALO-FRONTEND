import { NextResponse } from "next/server"

const backendBaseUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "")

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params

  const response = await fetch(`${backendBaseUrl}/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
