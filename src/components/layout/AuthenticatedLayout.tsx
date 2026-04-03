"use client"
import { useAuthStore } from "@/store/auth.store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
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

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    }
  }, [user, router])

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="hidden lg:flex flex-col w-72 bg-black/80 border-r border-white/10 p-6 gap-8 shadow-xl"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-red-500">MIRALO</h2>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="text-left px-4 py-2 rounded-xl text-white/80 hover:bg-red-600/20 hover:text-white font-medium transition-all"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Signed in as</p>
            <p className="text-sm font-semibold text-white">{user?.name || user?.email || "Viewer"}</p>
          </div>
          <button
            onClick={() => { logout(); router.replace("/login") }}
            className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 mt-2"
          >
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
