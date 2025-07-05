"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, TrendingDown, Calendar, Download, RefreshCw, PieChart, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getAllCertificates } from "../lib/ssl-service"

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({
    expirations: [
      { month: "Ene", count: 2 },
      { month: "Feb", count: 1 },
      { month: "Mar", count: 4 },
      { month: "Abr", count: 3 },
      { month: "May", count: 2 },
      { month: "Jun", count: 5 },
    ],
    types: [
      { type: "APP MOVIL", count: 0, percentage: 0 },
      { type: "PAGINAS", count: 0, percentage: 0 },
    ],
    status: [
      { status: "Seguros", count: 0, color: "bg-green-500" },
      { status: "Advertencia", count: 0, color: "bg-yellow-500" },
      { status: "Críticos", count: 0, color: "bg-red-500" },
    ],
  })

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const certificates = await getAllCertificates()
      const now = new Date()

      // Calcular estadísticas por tipo
      const appMovil = certificates.filter((cert) => cert.type === "APP MOVIL").length
      const paginas = certificates.filter((cert) => cert.type === "PAGINAS").length
      const total = certificates.length

      // Calcular estadísticas por estado
      const critical = certificates.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days <= 7
      }).length

      const warning = certificates.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 7 && days <= 30
      }).length

      const safe = certificates.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 30
      }).length

      // Actualizar datos del gráfico
      setChartData({
        expirations: chartData.expirations, // Mantener datos de ejemplo
        types: [
          { type: "APP MOVIL", count: appMovil, percentage: Math.round((appMovil / total) * 100) },
          { type: "PAGINAS", count: paginas, percentage: Math.round((paginas / total) * 100) },
        ],
        status: [
          { status: "Seguros", count: safe, color: "bg-green-500" },
          { status: "Advertencia", count: warning, color: "bg-yellow-500" },
          { status: "Críticos", count: critical, color: "bg-red-500" },
        ],
      })
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analíticas</h2>
          <p className="text-gray-600">Métricas y estadísticas detalladas</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Renovaciones</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +25% vs mes anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">45d</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  hasta vencimiento
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-gray-900">98.5%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2.1% este mes
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  -15% vs semana anterior
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Vencimientos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vencimientos por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.expirations.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{item.month}</div>
                  <div className="flex-1">
                    <Progress value={(item.count / 5) * 100} className="h-3" />
                  </div>
                  <div className="w-8 text-sm text-gray-600">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.types.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-gray-600">{item.count} certificados</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <div className="text-xs text-gray-500">{item.percentage}% del total</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Certificados */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Certificados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartData.status.map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${item.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{item.count}</span>
                </div>
                <h3 className="font-medium text-gray-900">{item.status}</h3>
                <p className="text-sm text-gray-600">
                  {Math.round((item.count / chartData.status.reduce((acc, curr) => acc + curr.count, 0)) * 100)}% del
                  total
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias y Predicciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Próximos 30 días</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm">Certificados a vencer</span>
                  <Badge variant="secondary">{chartData.status[1].count + chartData.status[2].count}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm">Renovaciones programadas</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm">Nuevos certificados</span>
                  <Badge variant="secondary">2</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Recomendaciones</h4>
              <div className="space-y-3">
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Atención Requerida</p>
                  <p className="text-xs text-yellow-600">
                    {chartData.status[2].count} certificados requieren renovación inmediata
                  </p>
                </div>
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Optimización</p>
                  <p className="text-xs text-blue-600">Considera automatizar 5 renovaciones</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
