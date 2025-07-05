"use client"

import { useState, useEffect } from "react"
import { UsersIcon, Plus, Edit, Trash2, Shield, Eye, Settings, UserCheck, UserX, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "../../components/auth-provider"
import {
  getAllUsers,
  getAllRoles,
  createUser,
  updateUser,
  deleteUser,
  logActivity,
  type SystemUser,
  type UserRole,
} from "../lib/users-service"

interface UserFormData {
  email: string
  first_name: string
  last_name: string
  role_id: string
  phone: string
  department: string
}

const initialFormData: UserFormData = {
  email: "",
  first_name: "",
  last_name: "",
  role_id: "",
  phone: "",
  department: "",
}

export default function Users() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para el modal
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({})
  const [saving, setSaving] = useState(false)

  const { systemUser, hasPermission } = useAuth()
  const { toast } = useToast()

  const canManageUsers = hasPermission("manage_users")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar datos en paralelo
      const [usersData, rolesData] = await Promise.all([getAllUsers(), getAllRoles()])

      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (data: UserFormData): Partial<UserFormData> => {
    const errors: Partial<UserFormData> = {}

    if (!data.email.trim()) {
      errors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Formato de email inválido"
    }

    if (!data.first_name.trim()) {
      errors.first_name = "El nombre es requerido"
    }

    if (!data.last_name.trim()) {
      errors.last_name = "El apellido es requerido"
    }

    if (!data.role_id) {
      errors.role_id = "El rol es requerido"
    }

    return errors
  }

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCreate = () => {
    if (!canManageUsers) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para crear usuarios",
        variant: "destructive",
      })
      return
    }

    setEditingUser(null)
    setFormData(initialFormData)
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleEdit = (user: SystemUser) => {
    if (!canManageUsers) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para editar usuarios",
        variant: "destructive",
      })
      return
    }

    setEditingUser(user)
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id || "",
      phone: user.phone || "",
      department: user.department || "",
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)

      if (editingUser) {
        // Actualizar usuario existente
        const updatedUser = await updateUser(editingUser.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: formData.role_id,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
        })

        await logActivity("update_user", "user", editingUser.id, {
          updated_fields: Object.keys(formData),
          user_email: updatedUser.email,
        })

        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado correctamente",
        })
      } else {
        // Crear nuevo usuario
        const newUser = await createUser({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: formData.role_id,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
        })

        await logActivity("create_user", "user", newUser.id, {
          email: formData.email,
          role_id: formData.role_id,
        })

        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData(initialFormData)
      await loadData()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el usuario",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: SystemUser) => {
    if (!canManageUsers) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para eliminar usuarios",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteUser(user.id)
      await logActivity("delete_user", "user", user.id, {
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      })

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      })

      await loadData()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (user: SystemUser, newStatus: "active" | "inactive" | "suspended") => {
    if (!canManageUsers) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para cambiar el estado de usuarios",
        variant: "destructive",
      })
      return
    }

    try {
      await updateUser(user.id, { status: newStatus })
      await logActivity("change_user_status", "user", user.id, {
        old_status: user.status,
        new_status: newStatus,
        user_email: user.email,
      })

      const statusText = newStatus === "active" ? "activado" : newStatus === "inactive" ? "desactivado" : "suspendido"
      toast({
        title: "Estado actualizado",
        description: `El usuario ha sido ${statusText}`,
      })

      await loadData()
    } catch (error) {
      console.error("Error changing user status:", error)
      toast({
        title: "Error",
        description: "Error al cambiar el estado del usuario",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "super_admin":
      case "admin":
        return <Shield className="h-4 w-4" />
      case "manager":
        return <Settings className="h-4 w-4" />
      case "operator":
        return <UserCheck className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "super_admin":
        return "destructive"
      case "admin":
        return "default"
      case "manager":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "suspended":
        return "Suspendido"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    admins: users.filter((u) => u.role?.name === "admin" || u.role?.name === "super_admin").length,
    inactive: users.filter((u) => u.status === "inactive").length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>
        {canManageUsers && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Usuario
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Usuarios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Usuarios Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Administradores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">
                        {user.first_name} {user.last_name}
                        {user.id === systemUser?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Tú
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.department && <p className="text-xs text-gray-500">{user.department}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {user.role && (
                          <Badge variant={getRoleBadgeVariant(user.role.name)} className="flex items-center gap-1">
                            {getRoleIcon(user.role.name)}
                            {user.role.name.replace("_", " ").toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(user.status)}>{getStatusText(user.status)}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-gray-500">
                      {user.last_login ? (
                        <>
                          <p>Último acceso:</p>
                          <p>{new Date(user.last_login).toLocaleDateString()}</p>
                        </>
                      ) : (
                        <p>Nunca ha ingresado</p>
                      )}
                    </div>
                    {canManageUsers && user.id !== systemUser?.id && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.status === "active" ? (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(user, "inactive")}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(user, "active")}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                                <strong>
                                  {user.first_name} {user.last_name}
                                </strong>{" "}
                                y todos sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleFormChange("first_name", e.target.value)}
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
                  className={formErrors.last_name ? "border-red-500" : ""}
                />
                {formErrors.last_name && <p className="text-sm text-red-500">{formErrors.last_name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
                disabled={!!editingUser} // No permitir cambiar email en edición
              />
              {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_id">Rol *</Label>
              <select
                id="role_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role_id}
                onChange={(e) => handleFormChange("role_id", e.target.value)}
              >
                <option value="">Seleccionar rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name.replace("_", " ").toUpperCase()} - {role.description}
                  </option>
                ))}
              </select>
              {formErrors.role_id && <p className="text-sm text-red-500">{formErrors.role_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleFormChange("phone", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleFormChange("department", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : editingUser ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
