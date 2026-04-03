import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"

export function useAuthHydrated() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    if (!hydrated) {
      hydrateFromStorage()
    }
  }, [hydrateFromStorage, hydrated])

  return hydrated
}
