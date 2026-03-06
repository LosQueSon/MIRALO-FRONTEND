"use client"

import { useState } from "react"
import { loginRequest } from "../services/auth.service"
import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const setAuth = useAuthStore((state) => state.setAuth)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await loginRequest({ email, password })
      setAuth(response.user, response.token)
      router.push("/")
    } catch (error) {
      console.error("Error en login:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[360px] text-white flex flex-col items-center">
      {/* Título centrado */}
      <h2 className="text-3xl font-semibold mb-10 text-center">
        Iniciar sesión
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 bg-red-600 text-white hover:bg-white hover:text-red-700 transition-colors duration-200 py-2 rounded-md font-semibold w-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  )
}