"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { authWithGoogle } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/store/auth.store"

export default function AuthTokenSync() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const handledTokenRef = useRef<string | null>(null)

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token || handledTokenRef.current === token) {
      return
    }

    handledTokenRef.current = token
    let cancelled = false

    const syncSession = async () => {
      try {
        const authResponse = await authWithGoogle(token)
        if (cancelled) {
          return
        }

        setAuth(authResponse.user, authResponse.token)

        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("token")

        const nextPath = pathname === "/auth/google/callback" ? "/home" : pathname
        const query = nextParams.toString()
        router.replace(query ? `${nextPath}?${query}` : nextPath)
      } catch {
        if (cancelled) {
          return
        }

        logout()

        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("token")

        const query = nextParams.toString()
        const fallback = pathname === "/auth/google/callback"
          ? "/login?error=auth_failed"
          : query
            ? `${pathname}?${query}`
            : pathname

        router.replace(fallback)
      }
    }

    void syncSession()

    return () => {
      cancelled = true
    }
  }, [logout, pathname, router, searchParams, setAuth])

  return null
}
