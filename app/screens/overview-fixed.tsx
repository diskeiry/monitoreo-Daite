"use client"

import { useState, useEffect } from "react"
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, RefreshCw, Calendar, HardDrive, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllCertificates } from "../lib/ssl-service"
import type { SSLClient } from "../lib/ssl-service"
import { getAllClients, type ClientWithInfrastructure } from "../lib/clients-service"

export default function Overview() {
  const [certificates, setCertificates] = useState<SSLClient[]>([])
  const [clients, setClients] = useState<ClientWithInfrastructure[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expiringSoon: 0,
    expired: 0,
  })
  const [recentExecutableUpdates, setRecentExecutableUpdates] = useState<ClientWithInfrastructure[]>([])
  const [outdatedExecutables, setOutdatedExecutables] = useState<ClientWithInfrastructure[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const certs = await getAllCertificates()
      setCertificates(certs)
      calculateStats(certs)

      const allClients = await getAllClients()
      setClients(allClients)
      processClientExecutableData(allClients)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (certs: SSLClient[]) => {
    const now = new Date()
    let valid = 0
    let expiringSoon = 0
    let expired = 0

    certs.forEach((cert) => {
      const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (days < 0) {
        expired++
      } else if (days <= 30) {
        expiringSoon++
      } else {
        valid++
      }
    })

    setStats({
      total: certs.length,
      valid,
      expiringSoon,
      expired,
    })
  }

  const processClientExecutableData = (allClients: ClientWithInfrastructure[]) => {
    const now = new Date()
    const currentYear = now.getFullYear() // This will be 2025 based on current time
    const recentUpdates: ClientWithInfrastructure[] = []
    const outdated: ClientWithInfrastructure[] = []

    allClients.forEach((client) => {
      let latestDate: Date | null = null

      // 1. Try to get date from executable_last_update
      if (client.infrastructure?.executable_last_update) {
        const lastUpdateDate = new Date(client.infrastructure.executable_last_update)
        if (!isNaN(lastUpdateDate.getTime())) {
          latestDate = lastUpdateDate
        }
      }

      // 2. Try to parse date from executable_version if no valid latestDate yet or if version date is newer
      if (client.infrastructure?.executable_version) {
        const versionString = client.infrastructure.executable_version
        // Regex to find a date in DD/MM/YYYY format
        const match = versionString.match(/(\d{2}\/\d{2}\/\d{4})/)
        if (match && match[1]) {
          // Parse DD/MM/YYYY to YYYY-MM-DD for Date constructor
          const [day, month, year] = match[1].split("/")
          const parsedDate = new Date(`${year}-${month}-${day}`)
          if (!isNaN(parsedDate.getTime())) {
            if (!latestDate || parsedDate.getTime() > latestDate.getTime()) {
              latestDate = parsedDate
            }
          }
        }
      }

      // 3. Categorize based on the latest found date
      if (latestDate !== null) {
        const effectiveUpdateYear = latestDate.getFullYear()
        if (effectiveUpdateYear <= 2024) {
          // Outdated: 2024 or earlier
          outdated.push(client)
        } else if (effectiveUpdateYear === currentYear) {
          // Recent: current year (2025)
          recentUpdates.push(client)
        }
        // Clients with effectiveUpdateYear > currentYear (future dates) are not categorized
        // and will not appear in either list.
      } else {
        // If no valid date could be extracted from either field, consider it outdated
        outdated.push(client)
      }
    })

    // Sort recent updates by date, newest first
    recentUpdates.sort((a, b) => {
      const getLatestDateForSorting = (c: ClientWithInfrastructure) => {
        let date: Date | null = null
        if (c.infrastructure?.executable_last_update) {
          const d = new Date(c.infrastructure.executable_last_update)
          if (!isNaN(d.getTime())) date = d
        }
        if (c.infrastructure?.executable_version) {
          const match = c.infrastructure.executable_version.match(/(\d{2}\/\d{2}\/\d{4})/)
          if (match && match[1]) {
            const [day, month, year] = match[1].split("/")
            const d = new Date(`${year}-${month}-${day}`)
            if (!isNaN(d.getTime())) {
              if (!date || d.getTime() > date.getTime()) date = d
            }
          }
        }
        return date ? date.getTime() : 0
      }
      return getLatestDateForSorting(b) - getLatestDateForSorting(a)
    })

    setRecentExecutableUpdates(recentUpdates) // Show all recent updates
    setOutdatedExecutables(outdated)
  }

  const handleAddCertificate = () => {
    console.log("Navegando a SSL Monitor desde Overview")
    window.dispatchEvent(
      new CustomEvent("navigate-to-screen", {
        detail: { screen: "ssl-monitor" },
      }),
    )
  }

  const handleNavigateToClientInfrastructure = (clientId: string) => {
    console.log(`Navegando a la infraestructura del cliente: ${clientId}`)
    window.dispatchEvent(
      new CustomEvent("navigate-to-screen", {
        detail: { screen: "clients", clientId: clientId, tab: "infrastructure" }, // Pass clientId and tab to clients screen
      }),
    )
  }

  const getUpcomingRenewals = () => {
    const now = new Date()
    return certificates
      .filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days > 0 && days <= 30
      })
      .sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime())
      .slice(0, 4)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumen</h2>
          <p className="text-gray-600">Vista general del sistema</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificados</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Certificados monitoreados</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Válidos</p>
                <p className="text-3xl font-bold text-green-600">{stats.valid}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Vencer</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.expiringSoon}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.expiringSoon / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-sm text-gray-500 mt-1">Requieren atención inmediata</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executable Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Estado de Ejecutables de Clientes
          </CardTitle>
          <p className="text-sm text-gray-600">Monitoreo de versiones de ejecutables de clientes</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas Actualizaciones de Ejecutables */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Últimas Actualizaciones Recientes (2025) <br></br> Actualizados: {recentExecutableUpdates.length}
            </h3>
            {recentExecutableUpdates.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {recentExecutableUpdates.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleNavigateToClientInfrastructure(client.id)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">
                        Versión: {client.infrastructure?.executable_version || "N/A"}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Actualizado:{" "}
                      {client.infrastructure?.executable_last_update
                        ? new Date(client.infrastructure.executable_last_update).toLocaleDateString()
                        : "N/A"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">No hay actualizaciones recientes en 2025.</p>
              </div>
            )}
          </div>

          {/* Ejecutables Pendientes de Actualización */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Ejecutables Pendientes de Actualización (2024 o anterior)  Pendientes: {outdatedExecutables.length}
            </h3>
            {outdatedExecutables.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {outdatedExecutables.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => handleNavigateToClientInfrastructure(client.id)}
                  >
                    <div>
                      <p className="font-medium text-red-800">{client.name}</p>
                      <p className="text-sm text-red-600">
                        Versión: {client.infrastructure?.executable_version || "N/A"} | Última Actualización:{" "}
                        {client.infrastructure?.executable_last_update
                          ? new Date(client.infrastructure.executable_last_update).toLocaleDateString()
                          : "Desconocida"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-100 text-red-700 hover:bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation() // Evita que el clic en el botón active el onClick del div padre
                        handleNavigateToClientInfrastructure(client.id)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Actualizar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">Todos los ejecutables están al día o son recientes.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <p className="text-sm text-gray-600">Gestiona tus certificados SSL de manera eficiente</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAddCertificate} className="w-full justify-start h-12 text-left" size="lg">
              <Plus className="h-5 w-5 mr-3" />
              Agregar Certificado SSL
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 bg-transparent" size="lg">
              <RefreshCw className="h-5 w-5 mr-3" />
              Verificar Estado
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 bg-transparent" size="lg">
              <Calendar className="h-5 w-5 mr-3" />
              Programar Renovación
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Renovaciones</CardTitle>
            <p className="text-sm text-gray-600">Certificados que vencen en los próximos 30 días</p>
          </CardHeader>
          <CardContent>
            {getUpcomingRenewals().length > 0 ? (
              <div className="space-y-3">
                {getUpcomingRenewals().map((cert) => {
                  const days = Math.ceil((cert.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cert.domain}</p>
                        <p className="text-sm text-gray-600">Vence en {days} días</p>
                      </div>
                      <Badge variant={days <= 7 ? "destructive" : "secondary"}>
                        {days <= 7 ? "Crítico" : "Próximo"}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No hay renovaciones próximas</p>
                <p className="text-sm text-gray-500">Todos los certificados están al día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
