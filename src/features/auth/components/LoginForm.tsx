"use client"
import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

import { authWithGoogle } from "../services/auth.service"

// Reemplaza con tu CLIENT_ID de Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

export default function LoginForm() {
  const googleButton = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    // Cargar el script de Google Identity Services
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
    // eslint-disable-next-line
  }, [])

  async function handleCredentialResponse(response: any) {
    // Recibes el token de Google
    const googleToken = response.credential
    try {
      // Llama al servicio de autenticación (listo para backend)
      // const auth = await authWithGoogle(googleToken)
      // setAuth(auth.user, auth.token)
      // router.push("/")
      // Por ahora, solo muestra el token y mensaje UX
      alert("¡Bienvenido! Tu cuenta se autenticará con Google. (Integración backend pendiente)")
      console.log("Google ID Token:", googleToken)
    } catch (err) {
      alert("Error al autenticar con Google. Intenta de nuevo más tarde.")
    }
  }

  function renderGoogleButton() {
    if (window.google && googleButton.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        ux_mode: "popup"
      })
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: "filled",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width: 320,
      })
    }
  }

  return (
    <div className="w-[360px] text-white flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-semibold mb-6 text-center">
        Iniciar sesión
      </h2>
      <p className="text-base text-white/80 mb-8 text-center font-normal">
        Accede con tu cuenta Google<br />
        <span className="text-sm text-white/60">No necesitas registro, solo tu cuenta Google</span>
      </p>
      <div className="flex flex-col items-center w-full gap-6">
        {/* Botón Google Sign-In real, sin borde ni fondo gris, redondeado */}
        <div
          ref={googleButton}
          className="w-full flex justify-center items-center animate-fade-in"
          style={{ minHeight: 48, maxWidth: 320, height: 48, width: 320 }}
        />
      </div>
    </div>
  )
}