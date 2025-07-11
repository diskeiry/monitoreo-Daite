"use client"

import { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard,
  Shield,
  BarChart3,
  Calendar,
  FileText,
  Bell,
  Upload,
  Users,
  Settings,
  Building2,
  LogOut,
  Crown,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import { useIsMobile } from "@/hooks/use-mobile"
import OverviewScreen from "./screens/overview-fixed"
import SSLMonitorScreen from "./ssl-monitor"
import AnalyticsScreen from "./screens/analytics"
import CalendarScreen from "./screens/calendar"
import ReportsScreen from "./screens/reports"
import NotificationsScreen from "./screens/notifications"
import ImportExportScreen from "./screens/import-export"
import UsersScreen from "./screens/users"
import ClientsScreen from "./screens/clients"
import SettingsScreen from "./screens/settings"

interface MenuItem {
  id: string
  label: string
  icon: any
  component: React.ComponentType<any>
  description: string
  requiredPermission?: string
  badge?: string
}

const menuItems: MenuItem[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, component: OverviewScreen, description: "Vista general del sistema" },
  { id: "ssl-monitor", label: "Monitor SSL", icon: Shield, component: SSLMonitorScreen, description: "Gestión de certificados SSL", requiredPermission: "manage_certificates" },
  { id: "clients", label: "Clientes", icon: Building2, component: ClientsScreen, description: "Gestión de clientes e infraestructura", requiredPermission: "manage_clients" },
  { id: "analytics", label: "Analíticas", icon: BarChart3, component: AnalyticsScreen, description: "Estadísticas y métricas", requiredPermission: "view_analytics" },
  { id: "calendar", label: "Calendario", icon: Calendar, component: CalendarScreen, badge: "3", description: "Vencimientos programados" },
  { id: "reports", label: "Reportes", icon: FileText, component: ReportsScreen, description: "Informes y documentos", requiredPermission: "view_reports" },
  { id: "notifications", label: "Notificaciones", icon: Bell, component: NotificationsScreen, badge: "5", description: "Alertas y avisos", requiredPermission: "view_notifications" },
  { id: "import-export", label: "Importar/Exportar", icon: Upload, component: ImportExportScreen, description: "Gestión de datos", requiredPermission: "manage_data" },
  { id: "users", label: "Usuarios", icon: Users, component: UsersScreen, description: "Gestión de usuarios", requiredPermission: "manage_users" },
  { id: "settings", label: "Configuración", icon: Settings, component: SettingsScreen, description: "Ajustes del sistema", requiredPermission: "manage_settings" },
]

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth()
  const isMobile = useIsMobile()
  const [activeScreen, setActiveScreen] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      setActiveScreen(event.detail)
      if (isMobile) setSidebarOpen(false)
    }
    window.addEventListener("navigate-to-screen", handler as EventListener)
    return () => window.removeEventListener("navigate-to-screen", handler as EventListener)
  }, [isMobile])

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target) &&
        isMobile &&
        sidebarOpen
      ) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, sidebarOpen])

  const visibleMenuItems = menuItems.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission))
  const activeItem = visibleMenuItems.find((item) => item.id === activeScreen)
  const ActiveComponent = activeItem?.component || OverviewScreen

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      window.localStorage.clear()
      window.sessionStorage.clear()
      window.location.href = "/"
    }
  }

  const handleNavigate = (screenId: string) => {
    setActiveScreen(screenId)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`${sidebarOpen ? "w-64" : "w-0 hidden"} bg-white shadow-lg transition-all duration-300 flex flex-col fixed top-0 left-0 h-full z-20 md:static md:z-auto`}
        >
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                {/* <Shield className="h-5 w-5 text-white" /> */}
                <img src="/daite.svg" alt="Logo Daite" className="w-20 h-15" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Monitor Clientes</h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeScreen === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.role?.name === "super_admin" ? (
                  <Crown className="h-4 w-4 text-yellow-600" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {user?.first_name?.[0] || user?.username?.[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role?.name === "super_admin" ? "Super Administrador" : user?.role?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header
            className={`bg-white shadow-sm border-b px-6 py-4 fixed top-0 ${isMobile ? "left-0" : sidebarOpen ? "left-64" : "left-0"
              } right-0 z-10 transition-all`}
          >

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeItem?.label || "Dashboard"}</h2>
                <p className="text-sm text-gray-600">{activeItem?.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Sistema Activo
                </Badge>
                <span className="text-sm text-gray-500">{user?.username}</span>
                {isMobile && (
                  <Button ref={toggleButtonRef} variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-[88px]">
            <ActiveComponent onNavigate={handleNavigate} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
