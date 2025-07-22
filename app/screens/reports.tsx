"use client"

import { useState } from "react"
import { FileText, Download, Calendar, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAllCertificates } from "../lib/ssl-service"
import { getAllClients } from "../lib/clients-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface CustomReportConfig {
  name: string
  description: string
  dateFrom: string
  dateTo: string
  certificateTypes: string[]
  statuses: string[]
  domains: string
  format: string
  includeExpired: boolean
  includeExpiring: boolean
  daysThreshold: number
  includeClients: boolean
  clientCompanies: string
}

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [customConfig, setCustomConfig] = useState<CustomReportConfig>({
    name: "",
    description: "",
    dateFrom: "",
    dateTo: "",
    certificateTypes: [],
    statuses: [],
    domains: "",
    format: "csv",
    includeExpired: false,
    includeExpiring: true,
    daysThreshold: 30,
    includeClients: false,
    clientCompanies: "",
  })
  const { toast } = useToast()

  const reports = [
    {
      id: 1,
      name: "Reporte Mensual de Certificados",
      description: "Estado general de todos los certificados SSL",
      date: "2024-11-01",
      status: "Completado",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Análisis de Vencimientos",
      description: "Certificados próximos a vencer en los próximos 30 días",
      date: "2024-11-15",
      status: "Generando",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Reporte de Seguridad",
      description: "Evaluación de seguridad de certificados SSL",
      date: "2024-10-28",
      status: "Completado",
      size: "3.1 MB",
    },
  ]

  const certificateTypes = ["SSL/TLS", "Code Signing", "Email", "Client Authentication"]
  const statusOptions = ["Válido", "Expirado", "Próximo a vencer", "Revocado", "Pendiente"]

  const generateGeneralReport = async () => {
    try {
      setGenerating("general")
      const [certificates, clients] = await Promise.all([getAllCertificates(), getAllClients()])
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const certCSV = generateCSV(certificates, "cert")
      const clientCSV = generateCSV(clients, "client")
      const fullCSV = `${certCSV}\n\n${clientCSV}`
      downloadFile(fullCSV, "reporte-general.csv", "text/csv")
      toast({
        title: "Reporte generado",
        description: "El reporte general se ha descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(null)
    }
  }


  const generateExpirationReport = async () => {
    try {
      setGenerating("expiration")
      const certificates = await getAllCertificates()
      const now = new Date()
      const expiring = certificates.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days <= 30
      })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const csvContent = generateCSV(expiring, "cert")
      downloadFile(csvContent, "reporte-vencimientos.csv", "text/csv")
      toast({
        title: "Reporte de vencimientos generado",
        description: "El reporte se ha descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(null)
    }
  }

  const generateCustomReport = async () => {
    try {
      setGenerating("custom")
      const [certificates, clients] = await Promise.all([getAllCertificates(), getAllClients()])

      // Aplicar filtros personalizados a certificados
      let filteredCertificates = certificates

      // Filtrar por fechas
      if (customConfig.dateFrom) {
        const fromDate = new Date(customConfig.dateFrom)
        filteredCertificates = filteredCertificates.filter((cert) => cert.expirationDate >= fromDate)
      }

      if (customConfig.dateTo) {
        const toDate = new Date(customConfig.dateTo)
        filteredCertificates = filteredCertificates.filter((cert) => cert.expirationDate <= toDate)
      }

      // Filtrar por tipos de certificado
      if (customConfig.certificateTypes.length > 0) {
        filteredCertificates = filteredCertificates.filter((cert) => customConfig.certificateTypes.includes(cert.type))
      }

      // Filtrar por estados
      if (customConfig.statuses.length > 0) {
        filteredCertificates = filteredCertificates.filter((cert) => customConfig.statuses.includes(cert.status))
      }

      // Filtrar por dominios
      if (customConfig.domains.trim()) {
        const domainList = customConfig.domains.split(",").map((d) => d.trim().toLowerCase())
        filteredCertificates = filteredCertificates.filter((cert) =>
          domainList.some((domain) => cert.domain.toLowerCase().includes(domain)),
        )
      }

      // Filtrar por vencimientos
      const now = new Date()
      if (customConfig.includeExpiring) {
        const expiringCerts = certificates.filter((cert) => {
          const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return days <= customConfig.daysThreshold && days > 0
        })
        filteredCertificates = [...filteredCertificates, ...expiringCerts]
      }

      if (customConfig.includeExpired) {
        const expiredCerts = certificates.filter((cert) => cert.expirationDate < now)
        filteredCertificates = [...filteredCertificates, ...expiredCerts]
      }

      // Filtrar clientes si está habilitado
      let filteredClients = clients
      if (customConfig.includeClients) {
        if (customConfig.clientCompanies.trim()) {
          const companyList = customConfig.clientCompanies.split(",").map((c) => c.trim().toLowerCase())
          filteredClients = filteredClients.filter((client) =>
            companyList.some((company) => (client.company || "").toLowerCase().includes(company)),
          )
        }
      } else {
        filteredClients = []
      }

      // Eliminar duplicados
      filteredCertificates = filteredCertificates.filter(
        (cert, index, self) => index === self.findIndex((c) => c.domain === cert.domain),
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generar archivo según formato
      if (customConfig.format === "csv") {
        const sanitize = (text: string) =>
          text?.toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // quita acentos
            .replace(/[^\w\s@.()-]/gi, "")   // quita símbolos raros

        let csvContent = ""

        if (filteredCertificates.length > 0) {
          const certHeaders = ["Dominio", "Tipo", "Estado", "Fecha de Vencimiento"]
          const certRows = filteredCertificates.map((cert) => [
            sanitize(cert.domain),
            sanitize(cert.type),
            sanitize(cert.status),
            cert.expirationDate.toLocaleDateString(),
          ])
          csvContent += ["CERTIFICADOS SSL", certHeaders.join(","), ...certRows.map(r => r.join(","))].join("\n")
        }

        if (filteredClients.length > 0) {
          if (csvContent) csvContent += "\n\n"
          const clientHeaders = ["Nombre", "Empresa", "Correo", "Teléfono"]
          const clientRows = filteredClients.map((client) => [
            sanitize(client.name),
            sanitize(client.company ?? ""),
            sanitize(client.contact_email ?? ""),
            sanitize(client.contact_phone ?? ""),
          ])
          csvContent += ["CLIENTES", clientHeaders.join(","), ...clientRows.map(r => r.join(","))].join("\n")
        }

        downloadFile(csvContent, `${customConfig.name || "reporte-personalizado"}.csv`, "text/csv")
      

    } else if (customConfig.format === "json") {
      const jsonData = {
        reportName: customConfig.name,
        description: customConfig.description,
        generatedAt: new Date().toISOString(),
        certificates: filteredCertificates,
        clients: customConfig.includeClients ? filteredClients : [],
      }
      const jsonContent = JSON.stringify(jsonData, null, 2)
      downloadFile(jsonContent, `${customConfig.name || "reporte-personalizado"}.json`, "application/json")
    }

    toast({
      title: "Reporte personalizado generado",
      description: `Se encontraron ${filteredCertificates.length} certificados${customConfig.includeClients ? ` y ${filteredClients.length} clientes` : ""
        } que coinciden con los filtros`,
    })

    setShowCustomDialog(false)
    resetCustomConfig()
  } catch (error) {
    toast({
      title: "Error",
      description: "No se pudo generar el reporte personalizado",
      variant: "destructive",
    })
  } finally {
    setGenerating(null)
  }
}

const resetCustomConfig = () => {
  setCustomConfig({
    name: "",
    description: "",
    dateFrom: "",
    dateTo: "",
    certificateTypes: [],
    statuses: [],
    domains: "",
    format: "csv",
    includeExpired: false,
    includeExpiring: true,
    daysThreshold: 30,
    includeClients: false,
    clientCompanies: "",
  })
}

const handleCertificateTypeChange = (type: string, checked: boolean) => {
  if (checked) {
    setCustomConfig((prev) => ({
      ...prev,
      certificateTypes: [...prev.certificateTypes, type],
    }))
  } else {
    setCustomConfig((prev) => ({
      ...prev,
      certificateTypes: prev.certificateTypes.filter((t) => t !== type),
    }))
  }
}

const handleStatusChange = (status: string, checked: boolean) => {
  if (checked) {
    setCustomConfig((prev) => ({
      ...prev,
      statuses: [...prev.statuses, status],
    }))
  } else {
    setCustomConfig((prev) => ({
      ...prev,
      statuses: prev.statuses.filter((s) => s !== status),
    }))
  }
}

const generateCSV = (data: any[], type: "cert" | "client") => {
  if (type === "cert") {
    const headers = ["Dominio", "Tipo", "Estado", "Fecha de Vencimiento", "Días Restantes"]
    const rows = data.map((cert) => {
      const days = Math.ceil((cert.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return [cert.domain, cert.type, cert.status, cert.expirationDate.toLocaleDateString(), days.toString()]
    })
    return ["CERTIFICADOS SSL", headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  }

  if (type === "client") {
    const headers = [
      "Nombre",
      "Empresa",
      "Correo",
      "Teléfono",
      "Total Computadoras",
      "Versión de Windows Server",
      "VPN",
    ]
    const rows = data.map((client) => [
      client.name,
      client.company ?? "",
      client.contact_email ?? "",
      client.contact_phone ?? "",
      client.infrastructure?.total_computers?.toString() ?? "",
      client.infrastructure?.windows_server_version ?? "",
      client.infrastructure?.vpn ?? "",
    ])
    return ["CLIENTES", headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  }
  return ""
}

const downloadFile = (content: string, filename: string, contentType: string) => {
  const BOM = "\uFEFF" // Byte Order Mark para UTF-8 con BOM
  const blob = new Blob([BOM + content.replace(/,/g, ";")], { type: contentType }) // cambia , por ;
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

return (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
        <p className="text-gray-600">Genera y descarga informes detallados</p>
      </div>
      <Button>
        <FileText className="h-4 w-4 mr-2" />
        Nuevo Reporte
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Reporte General</h3>
          <p className="text-sm text-gray-600 mb-4">Estado completo del sistema</p>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={generateGeneralReport}
            disabled={generating === "general"}
          >
            {generating === "general" ? "Generando..." : "Generar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Reporte de Vencimientos</h3>
          <p className="text-sm text-gray-600 mb-4">Certificados próximos a vencer</p>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={generateExpirationReport}
            disabled={generating === "expiration"}
          >
            {generating === "expiration" ? "Generando..." : "Generar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Filter className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Reporte Personalizado</h3>
          <p className="text-sm text-gray-600 mb-4">Configura filtros específicos</p>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowCustomDialog(true)}>
            Configurar
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Reportes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{report.name}</h4>
                <p className="text-sm text-gray-600">{report.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">{report.date}</span>
                  <span className="text-xs text-gray-500">{report.size}</span>
                  <Badge variant={report.status === "Completado" ? "default" : "secondary"}>{report.status}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled={report.status !== "Completado"}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Modal de Reporte Personalizado */}
    <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Reporte Personalizado</DialogTitle>
          <DialogDescription>Define los filtros y parámetros para generar un reporte específico</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-name">Nombre del Reporte</Label>
              <Input
                id="report-name"
                value={customConfig.name}
                onChange={(e) => setCustomConfig((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Reporte de certificados críticos"
              />
            </div>

            <div>
              <Label htmlFor="report-description">Descripción</Label>
              <Textarea
                id="report-description"
                value={customConfig.description}
                onChange={(e) => setCustomConfig((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional del reporte"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">Fecha desde</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={customConfig.dateFrom}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Fecha hasta</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={customConfig.dateTo}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="domains">Dominios (separados por coma)</Label>
              <Textarea
                id="domains"
                value={customConfig.domains}
                onChange={(e) => setCustomConfig((prev) => ({ ...prev, domains: e.target.value }))}
                placeholder="ejemplo.com, test.org, *.midominio.com"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-clients"
                checked={customConfig.includeClients}
                onCheckedChange={(checked) =>
                  setCustomConfig((prev) => ({ ...prev, includeClients: checked as boolean }))
                }
              />
              <Label htmlFor="include-clients" className="text-sm">
                Incluir información de clientes
              </Label>
            </div>

            {customConfig.includeClients && (
              <div>
                <Label htmlFor="client-companies">Empresas de clientes (separadas por coma)</Label>
                <Textarea
                  id="client-companies"
                  value={customConfig.clientCompanies}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, clientCompanies: e.target.value }))}
                  placeholder="Empresa A, Empresa B, Corp XYZ"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Tipos de Certificado</Label>
              <div className="space-y-2 mt-2">
                {certificateTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={customConfig.certificateTypes.includes(type)}
                      onCheckedChange={(checked) => handleCertificateTypeChange(type, checked as boolean)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Estados</Label>
              <div className="space-y-2 mt-2">
                {statusOptions.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={customConfig.statuses.includes(status)}
                      onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm font-normal">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-expiring"
                  checked={customConfig.includeExpiring}
                  onCheckedChange={(checked) =>
                    setCustomConfig((prev) => ({ ...prev, includeExpiring: checked as boolean }))
                  }
                />
                <Label htmlFor="include-expiring" className="text-sm">
                  Incluir certificados próximos a vencer
                </Label>
              </div>

              {customConfig.includeExpiring && (
                <div className="ml-6">
                  <Label htmlFor="days-threshold">Días de umbral</Label>
                  <Input
                    id="days-threshold"
                    type="number"
                    value={customConfig.daysThreshold}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({ ...prev, daysThreshold: Number.parseInt(e.target.value) || 30 }))
                    }
                    min="1"
                    max="365"
                    className="w-20"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-expired"
                  checked={customConfig.includeExpired}
                  onCheckedChange={(checked) =>
                    setCustomConfig((prev) => ({ ...prev, includeExpired: checked as boolean }))
                  }
                />
                <Label htmlFor="include-expired" className="text-sm">
                  Incluir certificados expirados
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="format">Formato de exportación</Label>
              <Select
                value={customConfig.format}
                onValueChange={(value) => setCustomConfig((prev) => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={resetCustomConfig}>
            Limpiar
          </Button>
          <Button onClick={generateCustomReport} disabled={generating === "custom"}>
            {generating === "custom" ? "Generando..." : "Generar Reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
)
}
