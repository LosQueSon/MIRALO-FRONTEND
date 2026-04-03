"use client"

import { RefObject, useEffect } from "react"

interface UseGoogleIdentityParams {
  buttonRef: RefObject<HTMLDivElement | null>
  clientId: string
  onCredential: (response: GoogleCredentialResponse) => void
}

export function useGoogleIdentity({
  buttonRef,
  clientId,
  onCredential,
}: UseGoogleIdentityParams) {
  const missingClientId = !clientId

  useEffect(() => {
    if (missingClientId) {
      return
    }

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        ux_mode: "popup",
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width: 320,
      })
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
  }, [buttonRef, clientId, missingClientId, onCredential])

  return { missingClientId }
}
