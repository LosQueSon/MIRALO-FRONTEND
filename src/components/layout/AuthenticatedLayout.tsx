"use client"
import { useAuthStore } from "@/store/auth.store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { label: "Home", path: "/home" },
  { label: "Discovery", path: "/discovery" },
  { label: "Coming Soon", path: "/coming-soon" },
  { label: "Watch Party", path: "/watch-party" },
  { label: "Settings", path: "/settings" },
]

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const pathname = usePathname()
  const hydrated = useAuthHydrated()

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login")
    }
  }, [hydrated, user, router])

  if (!hydrated) {
    return null
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 overflow-hidden">
      {/* Sidebar visual igual a LoggedHomeView */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="hidden lg:flex flex-col w-72 shrink-0 rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl mt-4 mb-4 ml-4"
        style={{ height: 'calc(100vh - 2rem)' }}
      >
        {/* Logo centrado */}
        <div className="mb-6 flex items-center justify-center">
          <h2 className="text-3xl font-extrabold tracking-wide select-none">
            <span className="text-white">MIRA</span><span className="text-red-600">LO</span>
          </h2>
        </div>
        {/* Menú */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${pathname === item.path ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
            >
              {item.label === "Home" ? "Inicio" :
                item.label === "Discovery" ? "Descubrir" :
                item.label === "Coming Soon" ? "Próximamente" :
                item.label === "Watch Party" ? "Ver en grupo" :
                item.label === "Settings" ? "Configuración" : item.label}
            </button>
          ))}
        </nav>
        {/* Usuario y logout */}
        <div className="mt-10 space-y-3 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Sesión iniciada como</p>
          <p className="text-sm font-semibold text-white">{user?.name || user?.email || "Espectador"}</p>
          <button
            type="button"
            onClick={() => { logout(); router.replace("/login") }}
            className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
      {/* Main content: solo el contenido interno es scrolleable */}
      <main className="flex-1 flex flex-col h-full pr-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/55 backdrop-blur-xl"
            style={{ minHeight: 0 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
