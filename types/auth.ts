export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthError {
  error: string
  details?: string[]
  status: number
}
