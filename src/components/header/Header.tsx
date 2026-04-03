/**
 * Header - Navbar fijo con logo y botón de login
 * Responsable de navegación principal y acceso a autenticación
 */

"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

export default function Header() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <h1 className="text-2xl font-extrabold tracking-wide">
          <span className="text-white/90 group-hover:text-white transition-colors">
            MIRA
          </span>
          <span className="text-red-600 group-hover:text-red-500 transition-colors">
            LO
          </span>
        </h1>
      </Link>

      <div className="flex items-center gap-3">
        {token ? (
          <>
            <Link
              href="/home"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-5 font-semibold text-white transition-all duration-300 hover:bg-white/10"
            >
              Mi home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-5 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-6 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  )
}
