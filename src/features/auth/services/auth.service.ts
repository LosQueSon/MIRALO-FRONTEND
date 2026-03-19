import { AuthResponse } from "../types"

/**
 * Autenticación con Google: envía el token de Google al backend y recibe el usuario y token propio.
 * @param googleToken string - ID token de Google
 * @returns Promise<AuthResponse>
 */
export const authWithGoogle = async (
  googleToken: string
): Promise<AuthResponse> => {
  // TODO: Implementar llamada real al backend cuando esté disponible
  // Ejemplo:
  // const res = await fetch("/api/auth/google", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ token: googleToken })
  // })
  // return await res.json()
  throw new Error("No implementado: conectar con backend de autenticación")
}