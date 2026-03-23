/**
 * Header - Navbar fijo con logo y botón de login
 * Responsable de navegación principal y acceso a autenticación
 */

import Link from "next/link"

export default function Header() {
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

      {/* Botón Iniciar Sesión */}
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-6 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95 focus:outline-none"
      >
        Iniciar sesión
      </Link>
    </header>
  )
}
