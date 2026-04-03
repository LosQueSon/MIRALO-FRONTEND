"use client"


import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"


const gatewayBaseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "")


function GoogleCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const token = searchParams.get("token")
    const userRaw = searchParams.get("user")
    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw))
        setAuth(user, token)
        router.replace("/home")
      } catch {
        // fallback: reload or show error
        router.replace("/home")
      }
      return
    }

    const hasOAuthCode = Boolean(searchParams.get("code"))
    if (!hasOAuthCode || !gatewayBaseUrl) {
      return
    }

    const query = searchParams.toString()
    const forwardUrl = `${gatewayBaseUrl}/auth/google/callback${query ? `?${query}` : ""}`
    window.location.replace(forwardUrl)
  }, [searchParams, setAuth, router])

  return (
    <main className="h-screen w-screen overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-12">
      <section className="w-full max-w-2xl text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">Completando autenticación</h1>
        <p className="text-base sm:text-lg text-white/75">
          Estamos validando tu sesión. Si no avanzas en unos segundos, vuelve a iniciar sesión.
        </p>
      </section>
    </main>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackInner />
    </Suspense>
  )
}
