"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, Bell, Shield, Database, Mail, Globe, Trash2, Download, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  const { toast } = useToast()

  useEffect(() => {
    // Cargar configuración guardada del localStorage
    const savedSettings = localStorage.getItem("ssl-monitor-settings")
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) })
    }
  }, [])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Guardar en localStorage
      localStorage.setItem("ssl-monitor-settings", JSON.stringify(settings))

      // Simular guardado en base de datos
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEmail = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Email de prueba enviado",
        description: "Revisa tu bandeja de entrada",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de prueba",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "ssl-monitor-settings.json"
    link.click()

    toast({
      title: "Configuración exportada",
      description: "El archivo se ha descargado correctamente",
    })
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings({ ...settings, ...importedSettings })
          toast({
            title: "Configuración importada",
            description: "Los ajustes se han cargado correctamente",
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "El archivo no es válido",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
          <p className="text-gray-600">Ajusta las preferencias y configuración del SSL Monitor</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <input id="import-file" type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Guardando..." : "Guardar Todo"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                <p className="text-sm text-gray-600">Recibir alertas por correo electrónico</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Notificaciones Push</Label>
                <p className="text-sm text-gray-600">Alertas en tiempo real en el navegador</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="critical-alerts">Alertas Críticas</Label>
                <p className="text-sm text-gray-600">Notificaciones para certificados críticos</p>
              </div>
              <Switch
                id="critical-alerts"
                checked={settings.criticalAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, criticalAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Reportes Semanales</Label>
                <p className="text-sm text-gray-600">Resumen semanal por email</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-days">Días de Alerta Anticipada</Label>
              <Input
                id="alert-days"
                type="number"
                min="1"
                max="365"
                value={settings.alertDays}
                onChange={(e) => setSettings({ ...settings, alertDays: Number.parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-600">Alertar cuando falten X días para el vencimiento</p>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-renewal">Renovación Automática</Label>
                <p className="text-sm text-gray-600">Intentar renovar certificados automáticamente</p>
              </div>
              <Switch
                id="auto-renewal"
                checked={settings.autoRenewal}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRenewal: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backup">Respaldo Automático</Label>
                <p className="text-sm text-gray-600">Crear copias de seguridad periódicas</p>
              </div>
              <Switch
                id="backup"
                checked={settings.backupEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, backupEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Autenticación de Dos Factores</Label>
                <p className="text-sm text-gray-600">Seguridad adicional para tu cuenta</p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: Number.parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-600">Cerrar sesión automáticamente después de X minutos</p>
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Actualización Automática</Label>
                <p className="text-sm text-gray-600">Refrescar datos automáticamente</p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Modo Oscuro</Label>
                <p className="text-sm text-gray-600">Tema oscuro para la interfaz</p>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Intervalo de Actualización (minutos)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="1"
                max="60"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <select
                id="timezone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="America/Mexico_City">Ciudad de México</option>
                <option value="America/New_York">Nueva York</option>
                <option value="Europe/Madrid">Madrid</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="db-url">URL de Conexión</Label>
              <Input
                id="db-url"
                placeholder="postgresql://..."
                type="password"
                value={settings.dbUrl}
                onChange={(e) => setSettings({ ...settings, dbUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Frecuencia de Respaldo</Label>
              <select
                id="backup-frequency"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              >
                <option value="hourly">Cada hora</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention-days">Días de Retención</Label>
              <Input
                id="retention-days"
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: Number.parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-600">Días para mantener los respaldos</p>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full bg-transparent">
                <Database className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración de Email (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">Servidor SMTP</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Puerto</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Usuario</Label>
              <Input
                id="smtp-user"
                placeholder="tu-email@gmail.com"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Contraseña</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="smtp-secure"
                checked={settings.smtpSecure}
                onCheckedChange={(checked) => setSettings({ ...settings, smtpSecure: checked })}
              />
              <Label htmlFor="smtp-secure">Conexión Segura (TLS/SSL)</Label>
            </div>
            <Button variant="outline" onClick={handleTestEmail} disabled={isLoading}>
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? "Enviando..." : "Probar Email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-800">Restablecer Configuración</h4>
              <p className="text-sm text-red-600">Volver a los valores predeterminados del sistema</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("¿Estás seguro de que quieres restablecer toda la configuración?")) {
                  localStorage.removeItem("ssl-monitor-settings")
                  window.location.reload()
                }
              }}
            >
              Restablecer
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-800">Eliminar Todos los Datos</h4>
              <p className="text-sm text-red-600">Eliminar permanentemente todos los certificados y configuración</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("¿ESTÁS SEGURO? Esta acción NO se puede deshacer.")) {
                  toast({
                    title: "Funcionalidad restringida",
                    description: "Esta acción requiere permisos de super administrador",
                    variant: "destructive",
                  })
                }
              }}
            >
              Eliminar Todo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
