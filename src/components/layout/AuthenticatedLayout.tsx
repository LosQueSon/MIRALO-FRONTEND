"use client"
import { useAuthStore } from "@/store/auth.store"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated"
import { motion } from "framer-motion"
import CreateRoomModal from "@/components/layout/CreateRoomModal"
import BackendStatusBanner from "@/components/layout/BackendStatusBanner"
import ConfirmLeaveModal from "@/components/layout/ConfirmLeaveModal"
import { REQUEST_LEAVE_ACTIVE_ROOM_EVENT } from "@/lib/room-navigation"

const navItems = [
  { label: "Inicio", path: "/home" },
  { label: "Mis salas", path: "/my-rooms" },
  { label: "Crear sala", path: "create-room" },
  { label: "Configuración", path: "/settings" },
]

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const openCreateRoomModal = useAuthStore((state) => state.openCreateRoomModal)
  const isCreateRoomModalOpen = useAuthStore((state) => state.isCreateRoomModalOpen)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydrated = useAuthHydrated()
  const currentPage = useMemo(() => ({ key: pathname, node: children }), [children, pathname])
  const [displayedPage, setDisplayedPage] = useState(currentPage)
  const [pendingPage, setPendingPage] = useState<typeof currentPage | null>(null)
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle")
  const [isLeaveRoomModalOpen, setIsLeaveRoomModalOpen] = useState(false)
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string>("")

  const isInWatchPartyRoom = pathname === "/watch-party" && Boolean(searchParams.get("roomId"))

  useEffect(() => {
    if (currentPage.key === displayedPage.key) {
      if (currentPage.node !== displayedPage.node && phase === "idle") {
        setDisplayedPage(currentPage)
      }

      return
    }

    if (phase === "idle" || pendingPage?.key !== currentPage.key) {
      setPendingPage(currentPage)
      setPhase("exiting")
    }
  }, [currentPage, displayedPage, pendingPage, phase])

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login")
    }
  }, [hydrated, user, router])

  const requestNavigation = (targetPath: string) => {
    if (targetPath === "create-room") {
      openCreateRoomModal()
      return
    }

    if (isInWatchPartyRoom && targetPath !== pathname) {
      setPendingNavigationPath(targetPath)
      setIsLeaveRoomModalOpen(true)
      return
    }

    router.push(targetPath)
  }

  const confirmRoomExitAndNavigate = () => {
    const targetPath = pendingNavigationPath || "/home"

    window.dispatchEvent(
      new CustomEvent(REQUEST_LEAVE_ACTIVE_ROOM_EVENT, {
        detail: { targetPath },
      }),
    )

    setIsLeaveRoomModalOpen(false)
    setPendingNavigationPath("")
  }

  if (!hydrated) {
    return null
  }

  const isWatchPartyRoute = pathname === "/watch-party"

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 overflow-hidden gap-4 p-4">
      {/* Sidebar visual igual a LoggedHomeView */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="hidden lg:flex flex-col w-72 shrink-0 rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl"
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
              onClick={() => {
                requestNavigation(item.path)
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                item.path === "/home"
                  ? pathname === "/home"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                  : item.path === "create-room"
                    ? isCreateRoomModalOpen
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    : pathname === item.path
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
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
      <main className="flex-1 flex h-full flex-col overflow-hidden" style={{ height: 'calc(100vh - 2rem)' }}>
        {/* BackendStatusBanner renderizado como toast flotante en document.body */}
        <motion.div
          key={displayedPage.key}
          initial={phase === "entering" ? { opacity: 0, y: 14 } : false}
          animate={phase === "exiting" ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => {
            if (phase === "exiting" && pendingPage) {
              setDisplayedPage(pendingPage)
              setPendingPage(null)
              setPhase("entering")
              return
            }

            if (phase === "entering") {
              setPhase("idle")
            }
          }}
          className={`${isWatchPartyRoute ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto"} rounded-3xl border border-white/10 bg-black/55 backdrop-blur-xl`}
          style={{ willChange: "opacity, transform" }}
        >
          {displayedPage.node}
        </motion.div>
      </main>
      <ConfirmLeaveModal
        isOpen={isLeaveRoomModalOpen}
        title="Salir de la sala"
        message="Vas a salir de la sala activa para ir a otra sección. ¿Deseas continuar?"
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onConfirm={confirmRoomExitAndNavigate}
        onCancel={() => {
          setIsLeaveRoomModalOpen(false)
          setPendingNavigationPath("")
        }}
      />
      <CreateRoomModal />
    </div>
  )
}
