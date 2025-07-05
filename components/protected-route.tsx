"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "./auth-provider"
import LoginForm from "./login-form"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Si estamos en el servidor o cargando, mostrar un spinner
  if (!isClient || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg font-medium">Cargando...</span>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar el formulario de login
  if (!user) {
    return <LoginForm />
  }

  // Si hay usuario autenticado, mostrar el contenido protegido
  return <>{children}</>
}
