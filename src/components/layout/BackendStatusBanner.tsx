"use client"
import { useEffect, useState } from "react"
import { getReady } from "@/lib/backend/health"

export default function BackendStatusBanner() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [strictRedis, setStrictRedis] = useState<boolean | null>(null)
  const [services, setServices] = useState<{ mongo?: string; redis?: string }>({})

  useEffect(() => {
    let mounted = true

    const fetchReady = async () => {
      const info = await getReady()
      if (!mounted) return
      setReady(info ? info.status === 'ready' : false)
      setStrictRedis(Boolean(info?.strictRedis))
      setServices(info?.services ?? {})
    }

    void fetchReady()
    const id = setInterval(() => void fetchReady(), 10000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  if (ready === null) return null

  if (ready) return null

  // show only when not ready
  return (
    <div className="w-full bg-yellow-600/10 border border-yellow-600/20 text-yellow-200 px-4 py-2 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div>
          <strong>Atención:</strong> El backend no está listo. Servicios: Mongo={services.mongo ?? 'unknown'} Redis={services.redis ?? 'unknown'}
        </div>
        <div className="text-xs text-yellow-100/80">
          {strictRedis ? 'Modo redis estricto' : 'Modo fallback disponible'}
        </div>
      </div>
    </div>
  )
}
