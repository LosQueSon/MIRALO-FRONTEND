"use client"
import Link from "next/link"
export default function PublicHomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-12">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10">
        <h1 className="text-2xl font-extrabold tracking-wide">
          <span className="text-white/90">MIRA</span>
          <span className="text-red-600">LO</span>
        </h1>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-6 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Contenido centrado */}
      <div className="max-w-3xl w-full space-y-8 text-center animate-fade-in">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
          <span className="text-white">Mira con quien quieras,</span>
          <br />
          <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            donde estés
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-white/75 leading-relaxed mx-auto max-w-2xl">
          Watchpartys sincronizadas para ver películas, series y más con tus amigos, aunque estén lejos. Sin desajustes, sin complicaciones.
        </p>
        <div className="pt-4 flex justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-6 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Comenzar ahora
          </Link>
        </div>
      </div>
    </main>
  )
}
