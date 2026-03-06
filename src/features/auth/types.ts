export interface RegisterPayload {
  name: string
  email: string
  password: string
}
export interface User {
  id: string
  email: string
  name: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}