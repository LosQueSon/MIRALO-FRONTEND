import { LoginPayload, AuthResponse } from "../types"

export const loginRequest = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  // Simulación temporal hasta que backend esté listo

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          id: "1",
          email: payload.email,
          name: "Usuario Demo"
        },
        token: "fake-jwt-token"
      })
    }, 1000)
  })
}