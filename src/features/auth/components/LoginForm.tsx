"use client"
import React, { useState } from "react"
import { getGoogleLoginUrl } from "@/features/auth/services/auth.service"

export default function LoginForm() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = () => {
    try {
      const loginUrl = getGoogleLoginUrl()
      setErrorMessage(null)
      setStatusMessage("Redirigiendo al inicio de sesión...")
      window.location.assign(loginUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de configuración"
      setStatusMessage(null)
      setErrorMessage(message)
    }
  }

  return (
    <div className="w-full max-w-[360px] text-white flex flex-col items-center animate-fade-in">
      <div className="flex flex-col items-center w-full gap-6">
        <button
          type="button"
          onClick={handleLogin}
          className="inline-flex h-12 w-80 items-center justify-center rounded-full bg-white text-black font-semibold transition-all duration-300 hover:bg-white/90 active:scale-[0.98]"
        >
          Continue with Google
        </button>

        {statusMessage ? (
          <p className="text-sm text-green-300 text-center max-w-[320px]">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-red-300 text-center max-w-[320px]">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}