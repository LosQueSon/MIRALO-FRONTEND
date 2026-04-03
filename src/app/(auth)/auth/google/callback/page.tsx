"use client"


import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"


const gatewayBaseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "")


function GoogleCallbackInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const hasToken = Boolean(searchParams.get("token"))
    if (hasToken) {
      return
    }

    const hasOAuthCode = Boolean(searchParams.get("code"))
    if (!hasOAuthCode || !gatewayBaseUrl) {
      return
    }

    const query = searchParams.toString()
    const forwardUrl = `${gatewayBaseUrl}/auth/google/callback${query ? `?${query}` : ""}`
    window.location.replace(forwardUrl)
  }, [searchParams])

  return (
    <main className="h-screen w-screen overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-12">
      <section className="w-full max-w-2xl text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">Completando autenticacion</h1>
        <p className="text-base sm:text-lg text-white/75">
          Estamos validando tu sesion. Si no avanzas en unos segundos, vuelve a iniciar sesion.
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
