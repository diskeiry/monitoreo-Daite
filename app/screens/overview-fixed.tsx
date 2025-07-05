"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar, Plus, RefreshCw } from "lucide-react"
import { getAllCertificates } from "../lib/ssl-service"

interface Certificate {
  id: string
  domain: string
  issuer: string
  expires_at: string
  status: "valid" | "expiring" | "expired"
  days_until_expiry: number
}

interface OverviewProps {
  onNavigate?: (screen: string) => void
}

export default function Overview({ onNavigate }: OverviewProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const { toast } = useToast()

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const data = await getAllCertificates()

      // Convertir los datos al formato esperado
      const formattedData = data.map((cert: any) => ({
        id: cert.id,
        domain: cert.domain,
        issuer: cert.issuer || "Unknown",
        expires_at: cert.expirationDate.toISOString(),
        status: cert.status,
        days_until_expiry: Math.ceil((cert.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      }))

      setCertificates(formattedData)
    } catch (error) {
      console.error("Error loading certificates:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los certificados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  const handleVerifyStatus = async () => {
    setVerifying(true)
    try {
      await loadCertificates()
      toast({
        title: "Estado verificado",
        description: "Los certificados han sido actualizados",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar el estado",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleAddCertificate = () => {
    console.log("Navegando a SSL Monitor desde Overview...")

    // Usar la función de navegación del dashboard
    if (onNavigate) {
      onNavigate("ssl-monitor")
    }

    // También disparar el evento personalizado como fallback
    window.dispatchEvent(new CustomEvent("navigate-to-screen", { detail: "ssl-monitor" }))

    toast({
      title: "Navegación",
      description: "Abriendo Monitor SSL para agregar certificado",
    })
  }

  const handleScheduleRenewal = () => {
    if (onNavigate) {
      onNavigate("calendar")
    } else {
      window.dispatchEvent(new CustomEvent("navigate-to-screen", { detail: "calendar" }))
    }

    toast({
      title: "Navegación",
      description: "Abriendo calendario...",
    })
  }

  // Calcular estadísticas
  const totalCertificates = certificates.length
  const validCertificates = certificates.filter((cert) => cert.days_until_expiry > 30).length
  const expiringCertificates = certificates.filter(
    (cert) => cert.days_until_expiry > 0 && cert.days_until_expiry <= 30,
  ).length
  const expiredCertificates = certificates.filter((cert) => cert.days_until_expiry <= 0).length

  const validPercentage = totalCertificates > 0 ? Math.round((validCertificates / totalCertificates) * 100) : 0
  const expiringPercentage = totalCertificates > 0 ? Math.round((expiringCertificates / totalCertificates) * 100) : 0

  // Certificados próximos a vencer (próximos 30 días)
  const upcomingRenewals = certificates
    .filter((cert) => cert.days_until_expiry <= 30 && cert.days_until_expiry > 0)
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificados</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCertificates}</div>
            <p className="text-xs text-muted-foreground">Certificados monitoreados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Válidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validCertificates}</div>
            <div className="flex items-center space-x-2">
              <Progress value={validPercentage} className="flex-1" />
              <span className="text-xs text-muted-foreground">{validPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringCertificates}</div>
            <div className="flex items-center space-x-2">
              <Progress value={expiringPercentage} className="flex-1" />
              <span className="text-xs text-muted-foreground">{expiringPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCertificates}</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas importantes */}
      {expiredCertificates > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tienes {expiredCertificates} certificado(s) vencido(s) que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {expiringCertificates > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {expiringCertificates} certificado(s) vencerán pronto. Considera programar su renovación.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona tus certificados SSL de manera eficiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAddCertificate} className="w-full justify-start" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Certificado SSL
            </Button>
            <Button
              onClick={handleVerifyStatus}
              variant="outline"
              className="w-full justify-start bg-transparent"
              size="lg"
              disabled={verifying}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
              {verifying ? "Verificando..." : "Verificar Estado"}
            </Button>
            <Button
              onClick={handleScheduleRenewal}
              variant="outline"
              className="w-full justify-start bg-transparent"
              size="lg"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Programar Renovación
            </Button>
          </CardContent>
        </Card>

        {/* Próximas renovaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Renovaciones</CardTitle>
            <CardDescription>Certificados que vencen en los próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length > 0 ? (
              <div className="space-y-3">
                {upcomingRenewals.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{cert.domain}</p>
                      <p className="text-sm text-muted-foreground">Vence en {cert.days_until_expiry} días</p>
                    </div>
                    <Badge variant={cert.days_until_expiry <= 7 ? "destructive" : "secondary"}>
                      {cert.days_until_expiry <= 7 ? "Urgente" : "Próximo"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No hay renovaciones próximas</p>
                <p className="text-sm">Todos los certificados están al día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias del Sistema</CardTitle>
          <CardDescription>Resumen del estado general de tus certificados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{validPercentage}%</p>
              <p className="text-sm text-muted-foreground">Certificados válidos</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{upcomingRenewals.length}</p>
              <p className="text-sm text-muted-foreground">Renovaciones próximas</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{totalCertificates}</p>
              <p className="text-sm text-muted-foreground">Total monitoreados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
