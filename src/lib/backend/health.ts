const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '')

export type ReadyResponse = {
  status: 'ready' | 'not_ready'
  strictRedis?: boolean
  services: {
    mongo: string
    redis: string
  }
}

export async function getReady(): Promise<ReadyResponse | null> {
  try {
    const res = await fetch(`${backendBaseUrl}/ready`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json as ReadyResponse
  } catch {
    return null
  }
}

export async function getHealth(): Promise<any | null> {
  try {
    const res = await fetch(`${backendBaseUrl}/health`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default { getReady, getHealth }
