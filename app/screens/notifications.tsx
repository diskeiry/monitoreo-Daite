"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAllCertificates } from "../lib/ssl-service"

interface Notification {
  id: number
  type: "warning" | "success" | "info" | "error"
  title: string
  message: string
  time: string
  read: boolean
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    unread: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)

      // Cargar notificaciones guardadas
      const savedNotifications = localStorage.getItem("ssl-monitor-notifications")
      let notifs: Notification[] = savedNotifications ? JSON.parse(savedNotifications) : []

      // Si no hay notificaciones guardadas o son pocas, generar algunas basadas en certificados
      if (notifs.length < 4) {
        const certificates = await getAllCertificates()
        const now = new Date()

        // Generar notificaciones basadas en certificados
        const generatedNotifs: Notification[] = []

        // Certificados críticos (menos de 7 días)
        certificates.forEach((cert, index) => {
          const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (days <= 7) {
            generatedNotifs.push({
              id: Date.now() + index,
              type: "warning",
              title: "Certificado próximo a vencer",
              message: `${cert.domain} vence en ${days} días`,
              time: "Hace 2 horas",
              read: false,
            })
          } else if (days <= 30) {
            generatedNotifs.push({
              id: Date.now() + index + 100,
              type: "info",
              title: "Certificado por vencer",
              message: `${cert.domain} vence en ${days} días`,
              time: "Hace 1 día",
              read: Math.random() > 0.5, // Algunos leídos, otros no
            })
          }
        })

        // Agregar algunas notificaciones de éxito
        generatedNotifs.push({
          id: Date.now() + 1000,
          type: "success",
          title: "Renovación exitosa",
          message: "coopsantiago.com ha sido renovado correctamente",
          time: "Hace 4 horas",
          read: false,
        })

        notifs = [...generatedNotifs, ...notifs].slice(0, 10) // Limitar a 10 notificaciones

        // Guardar en localStorage
        localStorage.setItem("ssl-monitor-notifications", JSON.stringify(notifs))
      }

      setNotifications(notifs)

      // Calcular estadísticas
      const critical = notifs.filter((n) => n.type === "error").length
      const warning = notifs.filter((n) => n.type === "warning").length
      const info = notifs.filter((n) => n.type === "info" || n.type === "success").length
      const unread = notifs.filter((n) => !n.read).length

      setStats({ critical, warning, info, unread })
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    localStorage.setItem("ssl-monitor-notifications", JSON.stringify(updatedNotifications))

    // Actualizar estadísticas
    setStats((prev) => ({ ...prev, unread: 0 }))

    toast({
      title: "Notificaciones actualizadas",
      description: "Todas las notificaciones han sido marcadas como leídas",
    })
  }

  const deleteNotification = (id: number) => {
    const updatedNotifications = notifications.filter((n) => n.id !== id)
    setNotifications(updatedNotifications)
    localStorage.setItem("ssl-monitor-notifications", JSON.stringify(updatedNotifications))

    // Recalcular estadísticas
    const critical = updatedNotifications.filter((n) => n.type === "error").length
    const warning = updatedNotifications.filter((n) => n.type === "warning").length
    const info = updatedNotifications.filter((n) => n.type === "info" || n.type === "success").length
    const unread = updatedNotifications.filter((n) => !n.read).length

    setStats({ critical, warning, info, unread })

    toast({
      title: "Notificación eliminada",
      description: "La notificación ha sido eliminada correctamente",
    })
  }

  const markAsRead = (id: number) => {
    const updatedNotifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    setNotifications(updatedNotifications)
    localStorage.setItem("ssl-monitor-notifications", JSON.stringify(updatedNotifications))

    // Actualizar contador de no leídas
    const unread = updatedNotifications.filter((n) => !n.read).length
    setStats((prev) => ({ ...prev, unread }))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-8 w-8 animate-pulse text-blue-500 mx-auto mb-2" />
          <p>Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
          <p className="text-gray-600">Mantente al día con las alertas del sistema</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={stats.unread === 0}>
          Marcar todas como leídas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-600">Críticas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
            <div className="text-sm text-gray-600">Informativas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">No leídas</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay notificaciones disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    notification.read ? "bg-gray-50" : "bg-white border-blue-200"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && <Badge variant="secondary">Nueva</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
