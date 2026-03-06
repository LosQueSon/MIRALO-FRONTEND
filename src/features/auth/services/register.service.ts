import { RegisterPayload, AuthResponse } from "../types"

export const registerRequest = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  // Simulación temporal hasta que backend esté listo
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          id: "2",
          email: payload.email,
          name: payload.name
        },
        token: "fake-jwt-token-register"
      })
    }, 1200)
  })
}
