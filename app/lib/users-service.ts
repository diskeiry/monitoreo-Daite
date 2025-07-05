  import { supabase } from "./supabase"

  export interface UserRole {
    id: string
    name: string
    description: string
    permissions: Record<string, boolean>
    created_at: string
    updated_at: string
  }

  export interface SystemUser {
    id: string
    auth_user_id: string | null
    username: string
    email: string
    first_name: string
    last_name: string
    role_id: string | null
    status: "active" | "inactive" | "suspended"
    avatar_url: string | null
    phone: string | null
    department: string | null
    last_login: string | null
    login_count: number
    created_at: string
    updated_at: string
    role?: UserRole
  }

  export interface UserSession {
    id: string
    user_id: string
    session_token: string
    ip_address: string | null
    user_agent: string | null
    expires_at: string
    created_at: string
  }

  export interface ActivityLog {
    id: string
    user_id: string
    action: string
    resource_type: string | null
    resource_id: string | null
    details: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    user?: SystemUser
  }

  // Obtener todos los roles
  export const getAllRoles = async (): Promise<UserRole[]> => {
    const { data, error } = await supabase.from("user_roles").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching roles:", error)
      throw new Error("Error al obtener los roles")
    }

    return data || []
  }

  // Obtener todos los usuarios
  export const getAllUsers = async (): Promise<SystemUser[]> => {
    const { data, error } = await supabase
      .from("system_users")
      .select(`
        *,
        role:user_roles(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      throw new Error("Error al obtener los usuarios")
    }

    return data || []
  }

  // Obtener usuario por username
  export const getUserByUsername = async (username: string): Promise<SystemUser | null> => {
    const { data, error } = await supabase
      .from("system_users")
      .select(`
        *,
        role:user_roles(*)
      `)
      .eq("username", username)
      .eq("status", "active")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Usuario no encontrado
      }
      console.error("Error fetching user by username:", error)
      throw new Error("Error al obtener el usuario")
    }

    return data
  }

  // Obtener usuario actual (por auth_user_id si existe, sino por session)
  export const getCurrentUser = async (): Promise<SystemUser | null> => {
    // Intentar obtener de la sesión guardada primero
    const savedUser = localStorage.getItem("ssl_monitor_user")
    if (savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("ssl_monitor_user")
      }
    }

    return null
  }

  // Autenticar usuario por username y password
  export const authenticateUser = async (username: string, password: string): Promise<SystemUser | null> => {
    console.log(`Attempting to authenticate user: ${username}`)

    const user = await getUserByUsername(username)

    if (!user) {
      throw new Error("Usuario no encontrado")
    }

    if (user.status !== "active") {
      throw new Error("Usuario inactivo")
    }

    // Verificación de contraseña - incluye tu usuario específico
    const validCredentials: Record<string, string> = {
      lortega: "21652020", // Tu usuario específico
      admin: "admin123",
      manager: "manager123",
      operator: "operator123",
      viewer: "viewer123",
    }

    if (validCredentials[username] !== password) {
      throw new Error("Contraseña incorrecta")
    }

    console.log(`Authentication successful for user: ${username}`)

    // Actualizar último login
    await supabase
      .from("system_users")
      .update({
        last_login: new Date().toISOString(),
        login_count: user.login_count + 1,
      })
      .eq("id", user.id)

    return user
  }

  // Crear nuevo usuario
  export const createUser = async (userData: {
    username: string
    email: string
    first_name: string
    last_name: string
    role_id: string
    phone?: string
    department?: string
  }): Promise<SystemUser> => {
    const { data, error } = await supabase
      .from("system_users")
      .insert({
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        phone: userData.phone || null,
        department: userData.department || null,
        status: "active",
        login_count: 0,
      })
      .select(`
        *,
        role:user_roles(*)
      `)
      .single()

    if (error) {
      console.error("Error creating user:", error)
      if (error.code === "23505") {
        throw new Error("El nombre de usuario o email ya existe")
      }
      throw new Error("Error al crear el usuario")
    }

    return data
  }

  // Actualizar usuario
  export const updateUser = async (
    id: string,
    updates: Partial<{
      username: string
      first_name: string
      last_name: string
      email: string
      role_id: string
      status: "active" | "inactive" | "suspended"
      phone: string
      department: string
    }>,
  ): Promise<SystemUser> => {
    const { data, error } = await supabase
      .from("system_users")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        role:user_roles(*)
      `)
      .single()

    if (error) {
      console.error("Error updating user:", error)
      throw new Error("Error al actualizar el usuario")
    }

    return data
  }

  // Eliminar usuario
  export const deleteUser = async (id: string): Promise<void> => {
    const { error } = await supabase.from("system_users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      throw new Error("Error al eliminar el usuario")
    }
  }

  // Obtener logs de actividad
  export const getActivityLogs = async (limit = 50): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
      .from("user_activity_logs")
      .select(`
        *,
        user:system_users(first_name, last_name, username)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching activity logs:", error)
      throw new Error("Error al obtener los logs de actividad")
    }

    return data || []
  }

  // Registrar actividad
  export const logActivity = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>,
  ): Promise<void> => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return
    }

    const { error } = await supabase.from("user_activity_logs").insert({
      user_id: currentUser.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: null, // Se podría obtener del cliente
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error logging activity:", error)
    }
  }

  // Verificar permisos
  export const hasPermission = async (permission: string): Promise<boolean> => {
    const currentUser = await getCurrentUser()

    if (!currentUser?.role) {
      return false
    }

    return currentUser.role.permissions[permission] === true
  }

  // Actualizar último login
  export const updateLastLogin = async (): Promise<void> => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return
    }

    const { error } = await supabase
      .from("system_users")
      .update({
        last_login: new Date().toISOString(),
        login_count: currentUser.login_count + 1,
      })
      .eq("id", currentUser.id)

    if (error) {
      console.error("Error updating last login:", error)
    }
  }
