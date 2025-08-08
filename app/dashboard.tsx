"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
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

type Screen =
  | "overview"
  | "ssl-monitor"
  | "analytics"
  | "calendar"
  | "reports"
  | "notifications"
  | "import-export"
  | "users"
  | "clients"
  | "settings"

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("overview")

  // Escuchar eventos personalizados para navegación
  useEffect(() => {
    const handleNavigateToSSL = () => {
      console.log("Navigating to SSL Monitor from custom event")
      setCurrentScreen("ssl-monitor")
    }

    window.addEventListener("navigateToSSL", handleNavigateToSSL)

    return () => {
      window.removeEventListener("navigateToSSL", handleNavigateToSSL)
    }
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const menuItems = [
    {
      id: "overview",
      label: "Resumen",
      icon: LayoutDashboard,
      permission: "view_dashboard",
      description: "Vista general del sistema",
    },
    {
      id: "ssl-monitor",
      label: "Monitor SSL",
      icon: Shield,
      permission: "manage_certificates",
      description: "Gestión de certificados SSL",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Building2,
      permission: "manage_clients",
      description: "Gestión de clientes e infraestructura",
    },
    {
      id: "analytics",
      label: "Analíticas",
      icon: BarChart3,
      permission: "view_analytics",
      description: "Estadísticas y métricas",
    },
    {
      id: "calendar",
      label: "Calendario",
      icon: Calendar,
      permission: "view_calendar",
      description: "Vencimientos programados",
    },
    {
      id: "reports",
      label: "Reportes",
      icon: FileText,
      permission: "view_reports",
      description: "Informes y documentos",
    },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      permission: "view_notifications",
      description: "Alertas y avisos",
    },
    {
      id: "import-export",
      label: "Importar/Exportar",
      icon: Upload,
      permission: "manage_data",
      description: "Gestión de datos",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: Users,
      permission: "manage_users",
      description: "Gestión de usuarios",
    },
    {
      id: "settings",
      label: "Configuración",
      icon: Settings,
      permission: "manage_settings",
      description: "Ajustes del sistema",
    },
  ]

  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.permission))

  const renderScreen = () => {
    switch (currentScreen) {
      case "overview":
        return <OverviewScreen />
      case "ssl-monitor":
        return <SSLMonitorScreen />
      case "clients":
        return <ClientsScreen />
      case "analytics":
        return <AnalyticsScreen />
      case "calendar":
        return <CalendarScreen />
      case "reports":
        return <ReportsScreen />
      case "notifications":
        return <NotificationsScreen />
      case "import-export":
        return <ImportExportScreen />
      case "users":
        return <UsersScreen />
      case "settings":
        return <SettingsScreen />
      default:
        return <OverviewScreen />
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SSL Monitor</h1>
              <p className="text-sm text-gray-500">Dashboard v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentScreen === item.id

            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as Screen)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                {item.id === "notifications" && (
                  <Badge variant="secondary" className="text-xs">
                    5
                  </Badge>
                )}
                {item.id === "calendar" && (
                  <Badge variant="secondary" className="text-xs">
                    3
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {user.role?.name === "super_admin" ? (
                <Crown className="h-4 w-4 text-yellow-600" />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {user.first_name?.[0] || user.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role?.name === "super_admin" ? "Super Administrador" : user.role?.name}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {visibleMenuItems.find((item) => item.id === currentScreen)?.label || "Dashboard"}
              </h2>
              <p className="text-sm text-gray-600">
                {visibleMenuItems.find((item) => item.id === currentScreen)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Sistema Activo
              </Badge>
              <span className="text-sm text-gray-500">{user.username}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">{renderScreen()}</main>
      </div>
    </div>
  )
}
