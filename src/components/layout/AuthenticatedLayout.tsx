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
      {/* Sidebar visual igual a LoggedHomeView */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="hidden lg:flex flex-col w-72 shrink-0 rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl m-4"
        style={{ minHeight: 'calc(100vh - 2rem)' }}
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
              {item.label}
            </button>
          ))}
        </nav>
        {/* Usuario y logout */}
        <div className="mt-10 space-y-3 border-t border-white/10 pt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Signed in as</p>
          <p className="text-sm font-semibold text-white">{user?.name || user?.email || "Viewer"}</p>
          <button
            type="button"
            onClick={() => { logout(); router.replace("/login") }}
            className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
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
