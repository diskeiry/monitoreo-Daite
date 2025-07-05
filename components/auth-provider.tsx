"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { authenticateUser, updateLastLogin, type SystemUser } from "../app/lib/users-service"

interface AuthContextType {
  user: SystemUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SystemUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem("ssl_monitor_user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log("Restored user session:", userData.username)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("ssl_monitor_user")
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string) => {
    setLoading(true)
    try {
      console.log(`Attempting login for username: ${username}`)
      const userData = await authenticateUser(username, password)

      if (!userData) {
        throw new Error("No se pudo obtener la información del usuario")
      }

      console.log(`Login successful for user: ${userData.username} (${userData.role?.name})`)
      setUser(userData)

      // Guardar sesión en localStorage
      localStorage.setItem("ssl_monitor_user", JSON.stringify(userData))

      // Actualizar último login
      await updateLastLogin()
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      console.log("Signing out user:", user?.username)

      // Limpiar estado local
      setUser(null)

      // Limpiar localStorage
      localStorage.removeItem("ssl_monitor_user")

      // Limpiar sessionStorage también
      sessionStorage.clear()

      console.log("Sign out successful")
    } catch (error) {
      console.error("Error in signOut:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role || !user.role.permissions) {
      console.log(`Permission check failed: no user or role for permission '${permission}'`)
      return false
    }

    const hasAccess = user.role.permissions[permission] === true || user.role.permissions["access_all"] === true
    console.log(`Permission check for '${permission}': ${hasAccess} (user: ${user.username}, role: ${user.role.name})`)
    return hasAccess
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
