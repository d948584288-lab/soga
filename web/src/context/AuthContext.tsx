"use client"

import * as React from "react"
import { User } from "@/types"
import { authApi } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const currentUser = authApi.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setUser(res.user)
  }, [])

  const register = React.useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await authApi.register(email, password, displayName)
    setUser(res.user)
  }, [])

  const logout = React.useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
