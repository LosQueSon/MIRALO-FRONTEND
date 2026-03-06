"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerRequest } from "../services/register.service"
import { RegisterPayload } from "../types"

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }
    setLoading(true)
    try {
      const payload: RegisterPayload = { name, email, password }
      await registerRequest(payload)
      router.push("/login")
    } catch (err) {
      setError("Error en el registro. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[360px] text-white flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-semibold mb-10 text-center">
        Crear cuenta
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-transparent border-b border-white/40 py-2 focus:outline-none focus:border-red-600 transition-colors w-full"
            required
          />
        </div>
        {error && (
          <div className="text-red-400 text-xs text-center -mt-4">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 bg-red-600 text-white hover:bg-white hover:text-red-700 transition-colors duration-200 py-2 rounded-md font-semibold w-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <div className="flex flex-col items-center gap-2 mt-8 text-sm w-full animate-fade-in">
        <div className="flex gap-1">
          <span className="text-white/60">¿Ya tienes una cuenta?</span>
          <a
            href="/login"
            className="text-red-500 hover:underline hover:text-red-400 transition-colors font-semibold"
          >
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  )
}
