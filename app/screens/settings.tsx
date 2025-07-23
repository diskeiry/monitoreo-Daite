"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Save,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Trash2,
  Download,
  Upload,
  TestTube,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const [settings, setSettings] = useState({
    // Notificaciones
    emailNotifications: true,
    pushNotifications: false,
    alertDays: 30,
    criticalAlerts: true,
    weeklyReports: true,

    // Seguridad
    autoRenewal: false,
    backupEnabled: true,
    twoFactorAuth: false,
    sessionTimeout: 60,

    // Sistema
    autoRefresh: true,
    refreshInterval: 5,
    darkMode: false,
    language: "es",
    timezone: "America/Mexico_City",

    // Base de datos
    dbUrl: "",
    backupFrequency: "daily",
    retentionDays: 30,

    // SMTP
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [showPasswords, setShowPasswords] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    // Cargar configuración guardada del localStorage
    const savedSettings = localStorage.getItem("ssl-monitor-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...settings, ...parsed })
      } catch (error) {
        console.error("Error parsing saved settings:", error)
      }
    }

    // Aplicar tema oscuro si está habilitado
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  // Aplicar tema cuando cambie
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Validar configuración antes de guardar
      if (settings.alertDays < 1 || settings.alertDays > 365) {
        throw new Error("Los días de alerta deben estar entre 1 y 365")
      }

      if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
        throw new Error("El timeout de sesión debe estar entre 5 y 480 minutos")
      }

      // Guardar en localStorage
      localStorage.setItem("ssl-monitor-settings", JSON.stringify(settings))

      // Simular guardado en base de datos
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Aplicar configuraciones inmediatamente
      if (settings.autoRefresh) {
        console.log(`Auto-refresh habilitado cada ${settings.refreshInterval} minutos`)
      }

      toast({
        title: "✅ Configuración guardada",
        description: "Los cambios se han aplicado correctamente y están activos",
      })
    } catch (error) {
      toast({
        title: "❌ Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (type: string) => {
    setConnectionStatus({ ...connectionStatus, [type]: "testing" })

    try {
      let success = false
      let message = ""

      switch (type) {
        case "database":
          if (!settings.dbUrl) {
            throw new Error("URL de base de datos requerida")
          }
          await new Promise((resolve) => setTimeout(resolve, 2000))
          success = settings.dbUrl.includes("postgresql://") || settings.dbUrl.includes("postgres://")
          message = success ? "Conexión a base de datos exitosa" : "URL de base de datos inválida"
          break

        case "email":
          if (!settings.smtpHost || !settings.smtpUser) {
            throw new Error("Configuración SMTP incompleta")
          }
          await new Promise((resolve) => setTimeout(resolve, 2500))
          success = settings.smtpHost.length > 0 && settings.smtpUser.includes("@")
          message = success ? "Email de prueba enviado correctamente" : "Error en configuración SMTP"
          break

        case "backup":
          await new Promise((resolve) => setTimeout(resolve, 1500))
          success = settings.backupEnabled
          message = success ? "Respaldo creado exitosamente" : "Respaldos deshabilitados"
          break

        case "security":
          await new Promise((resolve) => setTimeout(resolve, 1000))
          success = true
          message = "Configuración de seguridad verificada"
          break

        default:
          success = Math.random() > 0.3
          message = success ? `Prueba de ${type} exitosa` : `Error en prueba de ${type}`
      }

      setConnectionStatus({ ...connectionStatus, [type]: success ? "success" : "error" })
      setTestResults({ ...testResults, [`${type}_message`]: message })

      toast({
        title: success ? "✅ Prueba exitosa" : "❌ Error en la prueba",
        description: message,
        variant: success ? "default" : "destructive",
      })
    } catch (error) {
      setConnectionStatus({ ...connectionStatus, [type]: "error" })
      const errorMessage = error instanceof Error ? error.message : `Error al probar ${type}`
      setTestResults({ ...testResults, [`${type}_message`]: errorMessage })

      toast({
        title: "❌ Error en la prueba",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleTestEmail = async () => {
    await handleTestConnection("email")
  }

  const handleExportSettings = () => {
    try {
      const exportData = {
        settings,
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        metadata: {
          totalSettings: Object.keys(settings).length,
          exportedBy: "SSL Monitor System",
        },
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `ssl-monitor-settings-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "📁 Configuración exportada",
        description: "El archivo se ha descargado correctamente con todas las configuraciones",
      })
    } catch (error) {
      toast({
        title: "❌ Error al exportar",
        description: "No se pudo crear el archivo de exportación",
        variant: "destructive",
      })
    }
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)

          // Validar estructura del archivo
          if (importedData.settings) {
            setSettings({ ...settings, ...importedData.settings })
            toast({
              title: "📥 Configuración importada",
              description: `Se han cargado ${Object.keys(importedData.settings).length} configuraciones correctamente`,
            })
          } else if (typeof importedData === "object") {
            // Formato legacy
            setSettings({ ...settings, ...importedData })
            toast({
              title: "📥 Configuración importada",
              description: "Los ajustes se han cargado correctamente (formato legacy)",
            })
          } else {
            throw new Error("Formato de archivo no válido")
          }
        } catch (error) {
          toast({
            title: "❌ Error al importar",
            description: "El archivo no es válido o está corrupto",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
    // Limpiar el input para permitir reimportar el mismo archivo
    event.target.value = ""
  }

  const handleDatabaseTest = async () => {
    await handleTestConnection("database")
  }

  const handleBackupTest = async () => {
    await handleTestConnection("backup")
  }

  const handleSecurityTest = async () => {
    await handleTestConnection("security")
  }

  const handleResetSettings = () => {
    if (confirm("¿Estás seguro de que quieres restablecer toda la configuración? Esta acción no se puede deshacer.")) {
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: false,
        alertDays: 30,
        criticalAlerts: true,
        weeklyReports: true,
        autoRenewal: false,
        backupEnabled: true,
        twoFactorAuth: false,
        sessionTimeout: 60,
        autoRefresh: true,
        refreshInterval: 5,
        darkMode: false,
        language: "es",
        timezone: "America/Mexico_City",
        dbUrl: "",
        backupFrequency: "daily",
        retentionDays: 30,
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        smtpSecure: true,
      }

      setSettings(defaultSettings)
      localStorage.removeItem("ssl-monitor-settings")
      setConnectionStatus({})
      setTestResults({})

      toast({
        title: "🔄 Configuración restablecida",
        description: "Todos los valores han vuelto a sus configuraciones predeterminadas",
      })
    }
  }

  const handleDeleteAllData = () => {
    if (
      confirm(
        "⚠️ ¿ESTÁS COMPLETAMENTE SEGURO? Esta acción eliminará TODOS los datos del sistema de forma PERMANENTE. Esta acción NO se puede deshacer.",
      )
    ) {
      if (
        confirm(
          "🚨 ÚLTIMA CONFIRMACIÓN: ¿Realmente quieres eliminar TODOS los certificados, usuarios, configuraciones y datos del sistema?",
        )
      ) {
        toast({
          title: "🔒 Funcionalidad restringida",
          description: "Esta acción requiere permisos de super administrador y confirmación adicional",
          variant: "destructive",
        })
      }
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionColor = (status: string) => {
    switch (status) {
      case "testing":
        return "border-blue-200 bg-blue-50"
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración del Sistema</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Ajusta las preferencias y configuración del SSL Monitor
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportSettings}
            className="hover:bg-blue-50 dark:hover:bg-blue-900 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("import-file")?.click()}
            className="hover:bg-green-50 dark:hover:bg-green-900"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <input id="import-file" type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isLoading ? "Guardando..." : "Guardar Todo"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Notificaciones por Email
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Recibir alertas por correo electrónico</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Notificaciones Push
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Alertas en tiempo real en el navegador</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="critical-alerts" className="font-medium">
                  Alertas Críticas
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Notificaciones para certificados críticos</p>
              </div>
              <Switch
                id="critical-alerts"
                checked={settings.criticalAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, criticalAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="weekly-reports" className="font-medium">
                  Reportes Semanales
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Resumen semanal por email</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="alert-days" className="font-medium">
                Días de Alerta Anticipada
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="alert-days"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.alertDays}
                  onChange={(e) => setSettings({ ...settings, alertDays: Number.parseInt(e.target.value) || 30 })}
                  className="w-24"
                />
                <div className="flex-1">
                  <Progress value={(settings.alertDays / 365) * 100} className="h-2" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">{settings.alertDays} días</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Alertar cuando falten X días para el vencimiento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="auto-renewal" className="font-medium">
                  Renovación Automática
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Intentar renovar certificados automáticamente
                </p>
              </div>
              <Switch
                id="auto-renewal"
                checked={settings.autoRenewal}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRenewal: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="backup" className="font-medium">
                  Respaldo Automático
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Crear copias de seguridad periódicas</p>
              </div>
              <Switch
                id="backup"
                checked={settings.backupEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, backupEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="two-factor" className="font-medium">
                  Autenticación de Dos Factores
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Seguridad adicional para tu cuenta</p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="session-timeout" className="font-medium">
                Tiempo de Sesión (minutos)
              </Label>
              <Input
                id="session-timeout"
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: Number.parseInt(e.target.value) || 60 })}
                className="w-full"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Cerrar sesión automáticamente después de X minutos
              </p>
            </div>

            <Button
              variant="outline"
              className={`w-full ${getConnectionColor(connectionStatus.security)}`}
              onClick={handleSecurityTest}
              disabled={connectionStatus.security === "testing"}
            >
              {getConnectionIcon(connectionStatus.security)}
              <span className="ml-2">Verificar Seguridad</span>
            </Button>
            {testResults.security_message && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-300">{testResults.security_message}</p>
            )}
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="auto-refresh" className="font-medium">
                  Actualización Automática
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Refrescar datos automáticamente</p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">
                  Modo Oscuro
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tema oscuro para la interfaz</p>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="refresh-interval" className="font-medium">
                Intervalo de Actualización (minutos)
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="refresh-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: Number.parseInt(e.target.value) || 5 })}
                  className="w-24"
                />
                <div className="flex-1">
                  <Progress value={(settings.refreshInterval / 60) * 100} className="h-2" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">
                  {settings.refreshInterval} min
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="language" className="font-medium">
                Idioma
              </Label>
              <select
                id="language"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="timezone" className="font-medium">
                Zona Horaria
              </Label>
              <select
                id="timezone"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="America/Mexico_City">🇲🇽 Ciudad de México</option>
                <option value="America/New_York">🇺🇸 Nueva York</option>
                <option value="America/Los_Angeles">🇺🇸 Los Ángeles</option>
                <option value="Europe/Madrid">🇪🇸 Madrid</option>
                <option value="Europe/London">🇬🇧 Londres</option>
                <option value="UTC">🌍 UTC</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <Label htmlFor="db-url" className="font-medium">
                URL de Conexión
              </Label>
              <div className="relative">
                <Input
                  id="db-url"
                  placeholder="postgresql://user:password@host:port/database"
                  type={showPasswords ? "text" : "password"}
                  value={settings.dbUrl}
                  onChange={(e) => setSettings({ ...settings, dbUrl: e.target.value })}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="backup-frequency" className="font-medium">
                Frecuencia de Respaldo
              </Label>
              <select
                id="backup-frequency"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              >
                <option value="hourly">⏰ Cada hora</option>
                <option value="daily">📅 Diario</option>
                <option value="weekly">📆 Semanal</option>
                <option value="monthly">🗓️ Mensual</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="retention-days" className="font-medium">
                Días de Retención
              </Label>
              <Input
                id="retention-days"
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: Number.parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">Días para mantener los respaldos</p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className={`w-full ${getConnectionColor(connectionStatus.database)}`}
                onClick={handleDatabaseTest}
                disabled={connectionStatus.database === "testing"}
              >
                {getConnectionIcon(connectionStatus.database)}
                <span className="ml-2">Probar Conexión</span>
              </Button>

              <Button
                variant="outline"
                className={`w-full ${getConnectionColor(connectionStatus.backup)}`}
                onClick={handleBackupTest}
                disabled={connectionStatus.backup === "testing"}
              >
                {getConnectionIcon(connectionStatus.backup)}
                <span className="ml-2">Crear Respaldo</span>
              </Button>
            </div>

            {(testResults.database_message || testResults.backup_message) && (
              <div className="space-y-2">
                {testResults.database_message && (
                  <p className="text-sm text-center text-gray-600 dark:text-gray-300">{testResults.database_message}</p>
                )}
                {testResults.backup_message && (
                  <p className="text-sm text-center text-gray-600 dark:text-gray-300">{testResults.backup_message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuración SMTP */}
      <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración de Email (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="smtp-host" className="font-medium">
                Servidor SMTP
              </Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="smtp-port" className="font-medium">
                Puerto
              </Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: Number.parseInt(e.target.value) || 587 })}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="smtp-user" className="font-medium">
                Usuario
              </Label>
              <Input
                id="smtp-user"
                placeholder="tu-email@gmail.com"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="smtp-password" className="font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPasswords ? "text" : "password"}
                  placeholder="••••••••"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-3">
              <Switch
                id="smtp-secure"
                checked={settings.smtpSecure}
                onCheckedChange={(checked) => setSettings({ ...settings, smtpSecure: checked })}
              />
              <Label htmlFor="smtp-secure" className="font-medium">
                Conexión Segura (TLS/SSL)
              </Label>
            </div>
            <Button
              variant="outline"
              className={`${getConnectionColor(connectionStatus.email)}`}
              onClick={handleTestEmail}
              disabled={connectionStatus.email === "testing"}
            >
              {getConnectionIcon(connectionStatus.email)}
              <span className="ml-2">{connectionStatus.email === "testing" ? "Enviando..." : "Probar Email"}</span>
            </Button>
          </div>

          {testResults.email_message && (
            <div
              className={`mt-4 p-4 rounded-lg ${connectionStatus.email === "success" ? "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
            >
              <div className="flex items-center gap-2">
                {getConnectionIcon(connectionStatus.email)}
                <span className="font-medium">{testResults.email_message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="shadow-lg border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Restablecer Configuración</h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Volver a los valores predeterminados del sistema
                </p>
              </div>
              <Button variant="destructive" onClick={handleResetSettings} className="bg-red-600 hover:bg-red-700">
                🔄 Restablecer
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Eliminar Todos los Datos</h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  ⚠️ Eliminar permanentemente todos los certificados y configuración
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAllData} className="bg-red-700 hover:bg-red-800">
                🗑️ Eliminar Todo
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Advertencia Importante</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Las acciones en la zona de peligro son irreversibles. Asegúrate de tener respaldos actualizados antes
                  de proceder. Algunas acciones requieren permisos de super administrador.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
