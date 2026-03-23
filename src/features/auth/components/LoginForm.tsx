"use client"
import React, { useEffect, useRef, useState } from "react"

// Tipos globales
declare global {
  interface GoogleCredentialResponse {
    credential: string
    select_by?: string
  }
}

// Reemplaza con tu CLIENT_ID de Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

export default function LoginForm() {
  const googleButton = useRef<HTMLDivElement>(null)
  const missingClientId = !GOOGLE_CLIENT_ID
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (missingClientId) {
      return
    }

    const handleCredentialResponse = (response: GoogleCredentialResponse) => {
      const googleToken = response.credential
      if (!googleToken) {
        setErrorMessage("No se recibió un token válido de Google. Intenta de nuevo.")
        return
      }

      // El backend de autenticación sigue en desarrollo.
      setErrorMessage(null)
      setStatusMessage("Inicio de sesión validado con Google. Conexión con backend pendiente.")
    }

    const renderGoogleButton = () => {
      if (window.google && googleButton.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: "popup",
        })
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "left",
          width: 320,
        })
      }
    }

    if (!window.google && !document.getElementById("google-identity")) {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.id = "google-identity"
      document.body.appendChild(script)
      script.onload = renderGoogleButton
    } else {
      renderGoogleButton()
    }
  }, [missingClientId])

  return (
    <div className="w-full max-w-[360px] text-white flex flex-col items-center animate-fade-in">
      <div className="flex flex-col items-center w-full gap-6">
        {/* Botón Google Sign-In real, sin borde ni fondo gris, redondeado */}
        <div
          ref={googleButton}
          className="w-full flex justify-center items-center animate-fade-in"
          style={{ minHeight: 48, maxWidth: 320, height: 48, width: 320 }}
        />
        {statusMessage ? (
          <p className="text-sm text-green-300 text-center max-w-[320px]">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-red-300 text-center max-w-[320px]">{errorMessage}</p>
        ) : null}
        {missingClientId ? (
          <p className="text-sm text-red-300 text-center max-w-[320px]">
            Configuración pendiente: falta NEXT_PUBLIC_GOOGLE_CLIENT_ID
          </p>
        ) : null}
      </div>
    </div>
  )
}