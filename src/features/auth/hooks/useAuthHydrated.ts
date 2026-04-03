import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"

export function useAuthHydrated() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    hydrateFromStorage()
    setHydrated(true)
  }, [hydrateFromStorage])

  return hydrated
}
