"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const hydrated = useAuthHydrated()

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login")
    }
  }, [hydrated, token, router])

  if (!hydrated) {
    return null
  }
  if (!token) {
    return null
  }
  return <>{children}</>
}
