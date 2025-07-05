"use client"

import { useState, useEffect, useMemo } from "react"
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar, Bell, Activity, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getAllCertificates, type SSLClient } from "../lib/ssl-service"

export default function Overview() {
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    safe: 0,
    expiringSoon: 0,
    renewed: 0,
  })
  const [certificates, setCertificates] = useState<SSLClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const certs = await getAllCertificates()
      setCertificates(certs)

      // Calcular estadísticas reales
      const now = new Date()
      const critical = certs.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days <= 7
      }).length

      const warning = certs.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 7 && days <= 30
      }).length

      const safe = certs.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 30
      }).length

      setStats({
        total: certs.length,
        critical,
        warning,
        safe,
        expiringSoon: critical + warning,
        renewed: 2, // Este valor podría venir de una tabla de historial
      })
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const recentActivity = [
    {
      id: 1,
      type: "warning",
      message: "app.coopemopc.com vence en 5 días",
      time: "Hace 2 horas",
      icon: AlertTriangle,
    },
    {
      id: 2,
      type: "success",
      message: "Certificado renovado: coopsantiago.com",
      time: "Hace 4 horas",
      icon: CheckCircle,
    },
    {
      id: 3,
      type: "info",
      message: "Nuevo certificado agregado: app.uapa.com.do",
      time: "Hace 6 horas",
      icon: Shield,
    },
    {
      id: 4,
      type: "warning",
      message: "app.coopleal.do requiere atención",
      time: "Hace 1 día",
      icon: Clock,
    },
  ]

  const upcomingExpirations = useMemo(() => {
    const now = new Date()
    return certificates
      .map((cert) => ({
        domain: cert.domain,
        days: Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        type: cert.type,
      }))
      .filter((cert) => cert.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 4)
  }, [certificates])

  const handleAddCertificate = () => {
    // En lugar de usar eventos personalizados, vamos a usar una función de callback
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "navigate", screen: "ssl-monitor" }, "*")
    }
  }

  const handleVerifyStatus = async () => {
    try {
      await loadData()
      // Mostrar notificación de éxito
      console.log("Estado verificado correctamente")
    } catch (error) {
      console.error("Error al verificar estado:", error)
    }
  }

  const handleScheduleRenewal = () => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "navigate", screen: "calendar" }, "*")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificados</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2 este mes
                </p>
              </div>
              <Shield className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticos</p>
                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Requieren atención
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Advertencias</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.warning}</p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Próximos a vencer
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Seguros</p>
                <p className="text-3xl font-bold text-green-600">{stats.safe}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Estado óptimo
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Salud del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado de Salud del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Certificados Seguros</span>
                <span>{Math.round((stats.safe / stats.total) * 100)}%</span>
              </div>
              <Progress value={(stats.safe / stats.total) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Cobertura SSL</span>
                <span>95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Renovaciones Automáticas</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Próximos Vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExpirations.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{cert.domain}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {cert.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{cert.days} días</p>
                    <p className="text-xs text-gray-500">restantes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === "warning"
                        ? "bg-yellow-100 text-yellow-600"
                        : activity.type === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col gap-2" onClick={handleAddCertificate}>
              <Shield className="h-6 w-6" />
              <span>Agregar Certificado</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleVerifyStatus}>
              <Server className="h-6 w-6" />
              <span>Verificar Estado</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleScheduleRenewal}>
              <Calendar className="h-6 w-6" />
              <span>Programar Renovación</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
