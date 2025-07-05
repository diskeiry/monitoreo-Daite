"use client"

import { useState, useEffect } from "react"
import { User, Edit, Save, X, Mail, Phone, Building, Calendar, Shield, Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "../../components/auth-provider"
import { updateUser, getActivityLogs, type ActivityLog } from "../lib/users-service"

interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  department: string
}

export default function Profile() {
  const { systemUser } = useAuth()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    department: "",
  })

  const [formErrors, setFormErrors] = useState<Partial<ProfileFormData>>({})

  useEffect(() => {
    if (systemUser) {
      setFormData({
        first_name: systemUser.first_name || "",
        last_name: systemUser.last_name || "",
        phone: systemUser.phone || "",
        department: systemUser.department || "",
      })
    }
  }, [systemUser])

  useEffect(() => {
    loadActivityLogs()
  }, [])

  const loadActivityLogs = async () => {
    try {
      setLoadingActivity(true)
      const logs = await getActivityLogs(10) // Últimas 10 actividades
      setActivityLogs(logs)
    } catch (error) {
      console.error("Error loading activity logs:", error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const validateForm = (data: ProfileFormData): Partial<ProfileFormData> => {
    const errors: Partial<ProfileFormData> = {}

    if (!data.first_name.trim()) {
      errors.first_name = "El nombre es requerido"
    }

    if (!data.last_name.trim()) {
      errors.last_name = "El apellido es requerido"
    }

    if (data.phone && !/^[\d\s\-+$$$$]+$/.test(data.phone)) {
      errors.phone = "Formato de teléfono inválido"
    }

    return errors
  }

  const handleFormChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSave = async () => {
    if (!systemUser) return

    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setLoading(true)

      await updateUser(systemUser.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
      })

      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente",
      })

      setIsEditing(false)
      // Recargar la página para actualizar el contexto de usuario
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (systemUser) {
      setFormData({
        first_name: systemUser.first_name || "",
        last_name: systemUser.last_name || "",
        phone: systemUser.phone || "",
        department: systemUser.department || "",
      })
    }
    setFormErrors({})
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      login: "Inicio de sesión",
      logout: "Cierre de sesión",
      create_certificate: "Certificado creado",
      update_certificate: "Certificado actualizado",
      delete_certificate: "Certificado eliminado",
      create_user: "Usuario creado",
      update_user: "Usuario actualizado",
      delete_user: "Usuario eliminado",
      export_data: "Datos exportados",
      import_data: "Datos importados",
    }
    return actions[action] || action
  }

  if (!systemUser) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
          <p className="text-gray-600">Gestiona tu información personal y configuración de cuenta</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {systemUser.first_name[0]}
                    {systemUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {systemUser.first_name} {systemUser.last_name}
                  </h3>
                  <p className="text-gray-600">{systemUser.email}</p>
                  {systemUser.role && (
                    <Badge variant="outline" className="mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {systemUser.role.name.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleFormChange("first_name", e.target.value)}
                    disabled={!isEditing}
                    className={formErrors.first_name ? "border-red-500" : ""}
                  />
                  {formErrors.first_name && <p className="text-sm text-red-500">{formErrors.first_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleFormChange("last_name", e.target.value)}
                    disabled={!isEditing}
                    className={formErrors.last_name ? "border-red-500" : ""}
                  />
                  {formErrors.last_name && <p className="text-sm text-red-500">{formErrors.last_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 234 567 8900"
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ej: IT, Seguridad, Administración"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2">Cargando actividad...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{getActionText(log.action)}</p>
                        <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                        {log.details && (
                          <p className="text-xs text-gray-600 mt-1">{JSON.stringify(log.details).slice(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información de Cuenta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{systemUser.email}</p>
                  </div>
                </div>

                {systemUser.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-gray-600">{systemUser.phone}</p>
                    </div>
                  </div>
                )}

                {systemUser.department && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Departamento</p>
                      <p className="text-sm text-gray-600">{systemUser.department}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Miembro desde</p>
                    <p className="text-sm text-gray-600">{formatDate(systemUser.created_at)}</p>
                  </div>
                </div>

                {systemUser.last_login && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Último acceso</p>
                      <p className="text-sm text-gray-600">{formatDate(systemUser.last_login)}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Estado de la cuenta</p>
                <Badge variant={systemUser.status === "active" ? "default" : "secondary"}>
                  {systemUser.status === "active" ? "Activa" : "Inactiva"}
                </Badge>
              </div>

              {systemUser.role && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rol y permisos</p>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Shield className="h-3 w-3" />
                    {systemUser.role.name.replace("_", " ").toUpperCase()}
                  </Badge>
                  <p className="text-xs text-gray-600">{systemUser.role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
