"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Shield, Loader2, User, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./auth-provider"

// const demoUsers = [
//   {
//     username: "lortega",
//     password: "21652020",
//     role: "Super Admin",
//     description: "Administrador Principal - Acceso completo",
//     isMain: true,
//   },
//   {
//     username: "admin",
//     password: "admin123",
//     role: "Admin",
//     description: "Administrador del sistema",
//     isMain: false,
//   },
//   {
//     username: "manager",
//     password: "manager123",
//     role: "Manager",
//     description: "Gestión de certificados y reportes",
//     isMain: false,
//   },
//   {
//     username: "operator",
//     password: "operator123",
//     role: "Operator",
//     description: "Gestión básica de certificados",
//     isMain: false,
//   },
//   {
//     username: "viewer",
//     password: "viewer123",
//     role: "Viewer",
//     description: "Solo lectura",
//     isMain: false,
//   },
// ]

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDemoUsers, setShowDemoUsers] = useState(false)

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(username, password)
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername)
    setPassword(demoPassword)
    setError("")
    setLoading(true)

    try {
      await signIn(demoUsername, demoPassword)
    } catch (error: any) {
      console.error("Demo login error:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Monitor Clientes</CardTitle>
              <CardDescription className="text-gray-600">Sistema de Gestión de Clientes Daite</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre de Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* <Button
                variant="outline"
                size="sm"
                className="w-full mb-4 bg-transparent"
                onClick={() => setShowDemoUsers(!showDemoUsers)}
                disabled={loading}
              >
                {showDemoUsers ? "Ocultar" : "Mostrar"} Usuarios Disponibles
              </Button>

              {showDemoUsers && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 mb-3">Haz clic en cualquier usuario para acceder:</p>
                  {demoUsers.map((user, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        user.isMain ? "border-blue-200 bg-blue-50" : ""
                      }`}
                      onClick={() => handleDemoLogin(user.username, user.password)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          @{user.username}
                          {user.isMain && <Crown className="h-3 w-3 text-yellow-600" />}
                        </div>
                        <Badge
                          variant={user.isMain ? "default" : "outline"}
                          className={`text-xs ${user.isMain ? "bg-blue-600" : ""}`}
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{user.description}</div>
                      <div className="text-xs text-gray-500">
                        <code className="bg-gray-100 px-1 rounded">{user.password}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )} */}

              <div className="text-center text-sm text-gray-600 mt-4">
                <p className="text-xs mt-1">Acceso por nombre de usuario</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
