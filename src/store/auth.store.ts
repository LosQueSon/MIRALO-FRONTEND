import { create } from "zustand"
import { User } from "@/features/auth/types"

const TOKEN_STORAGE_KEY = "token"
const USER_STORAGE_KEY = "auth_user"


interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrateFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    set({ user: null, token: null, hydrated: true })
  },

  hydrateFromStorage: () => {
    if (typeof window === "undefined") {
      return
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)

    let user: User | null = null
    if (storedUser) {
      try {
        user = JSON.parse(storedUser) as User
      } catch {
        user = null
      }
    }

    set({ token: token || null, user, hydrated: true })
  },
}))
