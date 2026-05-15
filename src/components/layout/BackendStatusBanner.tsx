"use client"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getReady } from "@/lib/backend/health"

export default function BackendStatusBanner() {
  const [mounted, setMounted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [services, setServices] = useState<{ mongo?: string; redis?: string }>({})
  const [strictRedis, setStrictRedis] = useState<boolean | null>(null)
  
  const failureCountRef = useRef(0)
  const intervalIdRef = useRef<number | null>(null)
  const warningTimeoutIdRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchReady = async () => {
      const info = await getReady()
      if (!mounted) return

      const isReady = info ? info.status === 'ready' : false

      if (isReady) {
        // Backend está listo: resetear todo
        failureCountRef.current = 0
        setShowWarning(false)
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current)
          intervalIdRef.current = null
        }
        if (warningTimeoutIdRef.current) {
          clearTimeout(warningTimeoutIdRef.current)
          warningTimeoutIdRef.current = null
        }
      } else {
        // Backend no está listo
        failureCountRef.current += 1

        // Solo mostrar warning después de 2 fallos + 2 segundos de retraso de seguridad
        if (failureCountRef.current >= 2 && !showWarning) {
          if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current)
          warningTimeoutIdRef.current = window.setTimeout(() => {
            if (mounted) {
              setShowWarning(true)
            }
          }, 2000)
        }

        // Reintentar cada 5 segundos si no está listo
        if (!intervalIdRef.current) {
          intervalIdRef.current = window.setInterval(() => {
            if (mounted) {
              void fetchReady()
            }
          }, 5000)
        }
      }

      setStrictRedis(Boolean(info?.strictRedis))
      setServices(info?.services ?? {})
    }

    void fetchReady()

    return () => {
      mounted = false
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current)
      }
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -16, x: 16 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -16, x: 16 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl backdrop-blur-xl text-yellow-200 px-4 py-3 text-sm shadow-lg">
            <div className="font-semibold mb-1">Atención</div>
            <div className="text-xs text-yellow-100/80 space-y-1">
              <div>Backend no está listo</div>
              <div>Mongo: {services.mongo ?? 'unknown'} | Redis: {services.redis ?? 'unknown'}</div>
              {strictRedis && <div>Modo redis estricto activado</div>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
