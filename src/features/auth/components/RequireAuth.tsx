"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  useEffect(() => {
    if (!token) {
      router.replace("/login")
    }
  }, [router, token])

  if (!token) {
    return null
  }

  return <>{children}</>
}
