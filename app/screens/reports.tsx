"use client"

import { useState } from "react"
import { FileText, Download, Calendar, Filter, X } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  includeCertificates: boolean
  includeClients: boolean
  filterInfrastructure: boolean
  anydesk: string
  sqlManager: string
  storageMin: number | null
  storageMax: number | null
  serverAddresses: string
  compatibilityLevel: string
  executableVersion: string
  antivirus: string
  minComputers: number | null
  maxComputers: number | null
  windowsServerVersion: string
}

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [availableClients, setAvailableClients] = useState<any[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("")

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
    includeCertificates: true,
    includeClients: false,
    filterInfrastructure: false,
    anydesk: "",
    sqlManager: "",
    storageMin: null,
    storageMax: null,
    serverAddresses: "",
    compatibilityLevel: "",
    executableVersion: "",
    antivirus: "",
    minComputers: null,
    maxComputers: null,
    windowsServerVersion: "",
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

  const certificateTypes = ["APP MOVIL", "PAGINAS"]
  const statusOptions = ["Válido", "Expirado", "Próximo a vencer", "Revocado", "Pendiente"]
  const sqlManagerOptions = ["SQL Server 2016", "SQL Server 2019", "SQL Server 2022", "MySQL", "PostgreSQL", "Oracle"]
  const compatibilityOptions = ["110", "120", "130", "140", "150", "160"]
  const antivirusOptions = ["Windows Defender", "Avast", "Norton", "McAfee", "Kaspersky", "ESET", "Bitdefender"]
  const windowsServerOptions = ["Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Linux"]

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
        return days <= 30 && days > 0
      })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const csvContent = generateCSV(expiring, "cert")
      downloadFile(csvContent, "reporte-vencimientos.csv", "text/csv")
      toast({
        title: "Reporte de vencimientos generado",
        description: `Se encontraron ${expiring.length} certificados próximos a vencer`,
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

  const loadAvailableClients = async () => {
    try {
      const clients = await getAllClients()
      setAvailableClients(clients)
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const handleClientSelection = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds((prev) => [...prev, clientId])
    } else {
      setSelectedClientIds((prev) => prev.filter((id) => id !== clientId))
    }
  }

  const generateCustomReport = async () => {
    try {
      setGenerating("custom")
      const [certificates, allClients] = await Promise.all([getAllCertificates(), getAllClients()])

      let finalCertificates: any[] = []
      let filteredClients: any[] = []

      // Solo procesar certificados si está habilitado
      if (customConfig.includeCertificates) {
        let tempCertificates = [...certificates]

        // Filtrar por fechas de vencimiento
        if (customConfig.dateFrom) {
          const fromDate = new Date(customConfig.dateFrom)
          tempCertificates = tempCertificates.filter((cert) => cert.expirationDate >= fromDate)
        }
        if (customConfig.dateTo) {
          const toDate = new Date(customConfig.dateTo)
          tempCertificates = tempCertificates.filter((cert) => cert.expirationDate <= toDate)
        }

        // Filtrar por tipos de certificado
        if (customConfig.certificateTypes.length > 0) {
          tempCertificates = tempCertificates.filter((cert) => customConfig.certificateTypes.includes(cert.type))
        }

        // Filtrar por estados
        if (customConfig.statuses.length > 0) {
          tempCertificates = tempCertificates.filter((cert) => customConfig.statuses.includes(cert.status))
        }

        // Filtrar por dominios
        if (customConfig.domains.trim()) {
          const domainList = customConfig.domains.split(",").map((d) => d.trim().toLowerCase())
          tempCertificates = tempCertificates.filter((cert) =>
            domainList.some((domain) => cert.domain.toLowerCase().includes(domain)),
          )
        }

        // Aplicar filtros de vencimiento
        const now = new Date()
        const tempFinalCertificates: any[] = []

        if (customConfig.includeExpiring) {
          const expiringCerts = tempCertificates.filter((cert) => {
            const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return days <= customConfig.daysThreshold && days > 0
          })
          tempFinalCertificates.push(...expiringCerts)
        }

        if (customConfig.includeExpired) {
          const expiredCerts = tempCertificates.filter((cert) => cert.expirationDate < now)
          tempFinalCertificates.push(...expiredCerts)
        }

        // Si no se seleccionó ningún filtro de vencimiento, incluir todos los filtrados
        if (!customConfig.includeExpiring && !customConfig.includeExpired) {
          finalCertificates = tempCertificates
        } else {
          finalCertificates = tempFinalCertificates
        }

        // Eliminar duplicados
        finalCertificates = finalCertificates.filter(
          (cert, index, self) => index === self.findIndex((c) => c.id === cert.id),
        )
      }

      // Filtrar clientes si está habilitado
      if (customConfig.includeClients) {
        // Si hay clientes específicos seleccionados, usar solo esos
        if (selectedClientIds.length > 0) {
          filteredClients = allClients.filter((client: any) => selectedClientIds.includes(client.id))
        } else {
          filteredClients = [...allClients] // Si no hay selección específica, incluir todos los clientes
        }

        // Aplicar filtros de infraestructura si están habilitados
        if (customConfig.filterInfrastructure) {
          // Filtrar por AnyDesk
          if (customConfig.anydesk.trim()) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.anydesk &&
                client.infrastructure.anydesk.toLowerCase().includes(customConfig.anydesk.toLowerCase()),
            )
          }

          // Filtrar por SQL Manager
          if (customConfig.sqlManager && customConfig.sqlManager !== "none") {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.sql_manager_version &&
                client.infrastructure.sql_manager_version.toLowerCase().includes(customConfig.sqlManager.toLowerCase()),
            )
          }

          // Filtrar por almacenamiento
          if (customConfig.storageMin !== null) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.total_storage_gb &&
                client.infrastructure.total_storage_gb >= (customConfig.storageMin || 0),
            )
          }
          if (customConfig.storageMax !== null) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.total_storage_gb &&
                client.infrastructure.total_storage_gb <= (customConfig.storageMax || Number.POSITIVE_INFINITY),
            )
          }

          // Filtrar por nivel de compatibilidad
          if (customConfig.compatibilityLevel && customConfig.compatibilityLevel !== "none") {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.compatibility_level &&
                client.infrastructure.compatibility_level.includes(customConfig.compatibilityLevel),
            )
          }

          // Filtrar por versión ejecutable
          if (customConfig.executableVersion.trim()) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.executable_version &&
                client.infrastructure.executable_version
                  .toLowerCase()
                  .includes(customConfig.executableVersion.toLowerCase()),
            )
          }

          // Filtrar por antivirus
          if (customConfig.antivirus && customConfig.antivirus !== "none") {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.antivirus_server_name &&
                client.infrastructure.antivirus_server_name
                  .toLowerCase()
                  .includes(customConfig.antivirus.toLowerCase()),
            )
          }

          // Filtrar por número de computadoras
          if (customConfig.minComputers !== null) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.total_computers &&
                client.infrastructure.total_computers >= (customConfig.minComputers || 0),
            )
          }
          if (customConfig.maxComputers !== null) {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.total_computers &&
                client.infrastructure.total_computers <= (customConfig.maxComputers || Number.POSITIVE_INFINITY),
            )
          }

          // Filtrar por versión de Windows Server
          if (customConfig.windowsServerVersion && customConfig.windowsServerVersion !== "none") {
            filteredClients = filteredClients.filter(
              (client) =>
                client.infrastructure?.windows_server_version &&
                client.infrastructure.windows_server_version
                  .toLowerCase()
                  .includes(customConfig.windowsServerVersion.toLowerCase()),
            )
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generar archivo según formato
      if (customConfig.format === "csv") {
        let csvContent = ""
        if (customConfig.includeCertificates && finalCertificates.length > 0) {
          csvContent += generateCSV(finalCertificates, "cert")
        }
        if (customConfig.includeClients && filteredClients.length > 0) {
          if (csvContent) csvContent += "\n\n"
          csvContent += generateCSV(filteredClients, "client")
        }

        if (!csvContent) {
          csvContent = "No se encontraron datos que coincidan con los filtros aplicados"
        }

        downloadFile(csvContent, `${customConfig.name || "reporte-personalizado"}.csv`, "text/csv")
      } else if (customConfig.format === "json") {
        const jsonData = {
          reportName: customConfig.name,
          description: customConfig.description,
          generatedAt: new Date().toISOString(),
          filters: customConfig,
          certificates: customConfig.includeCertificates ? finalCertificates : [],
          clients: customConfig.includeClients ? filteredClients : [],
          summary: {
            totalCertificates: customConfig.includeCertificates ? finalCertificates.length : 0,
            totalClients: customConfig.includeClients ? filteredClients.length : 0,
          },
        }
        const jsonContent = JSON.stringify(jsonData, null, 2)
        downloadFile(jsonContent, `${customConfig.name || "reporte-personalizado"}.json`, "application/json")
      }

      const certificateMessage = customConfig.includeCertificates ? `${finalCertificates.length} certificados` : ""
      const clientMessage = customConfig.includeClients ? `${filteredClients.length} clientes` : ""
      const messages = [certificateMessage, clientMessage].filter(Boolean)

      toast({
        title: "Reporte personalizado generado",
        description: `Se encontraron ${messages.join(" y ")} que coinciden con los filtros`,
      })
      setShowCustomDialog(false)
      resetCustomConfig()
    } catch (error) {
      console.error("Error al generar reporte:", error)
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
      includeCertificates: true,
      includeClients: false,
      filterInfrastructure: false,
      anydesk: "",
      sqlManager: "",
      storageMin: null,
      storageMax: null,
      serverAddresses: "",
      compatibilityLevel: "",
      executableVersion: "",
      antivirus: "",
      minComputers: null,
      maxComputers: null,
      windowsServerVersion: "",
    })
    setSelectedClientIds([])
    setClientSearchTerm("")
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
      const headers = ["Dominio", "Tipo", "Estado", "Fecha de Vencimiento", "Días Restantes", "Descripción"]
      const rows = data.map((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return [
          cert.domain || "",
          cert.type || "",
          cert.status || "",
          cert.expirationDate ? cert.expirationDate.toLocaleDateString() : "",
          days.toString(),
          cert.description || "",
        ]
      })
      return ["CERTIFICADOS SSL", headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    }

    if (type === "client") {
      const headers = [
        "Nombre",
        "Empresa",
        "Correo",
        "Teléfono",
        "Dirección",
        "Total Computadoras",
        "Versión Windows Server",
        "Estado Windows Server",
        "Última Actualización Windows Server",
        "Nombre Antivirus Server",
        "Versión Antivirus Server",
        "Estado Antivirus Server",
        "RAM Total (GB)",
        "RAM Usada (GB)",
        "Porcentaje Uso RAM",
        "Almacenamiento Total (GB)",
        "Almacenamiento Usado (GB)",
        "Porcentaje Uso Almacenamiento",
        "Versión Windows Workstation",
        "Cantidad Windows Workstation",
        "Versión SQL Manager",
        "Estado SQL Manager",
        "Bases de Datos SQL",
        "Nivel de Compatibilidad",
        "Estado de Compatibilidad",
        "AnyDesk",
        "VPN",
        "Versión Ejecutable",
        "Último Escaneo",
      ]

      const rows = data.map((client) => [
        client.name || "",
        client.company || "",
        client.contact_email || "",
        client.contact_phone || "",
        client.address || "",
        client.infrastructure?.total_computers?.toString() || "",
        client.infrastructure?.windows_server_version || "",
        client.infrastructure?.windows_server_status || "",
        client.infrastructure?.windows_server_last_update || "",
        client.infrastructure?.antivirus_server_name || "",
        client.infrastructure?.antivirus_server_version || "",
        client.infrastructure?.antivirus_server_status || "",
        client.infrastructure?.total_ram_gb?.toString() || "",
        client.infrastructure?.used_ram_gb?.toString() || "",
        client.infrastructure?.ram_usage_percentage?.toString() || "",
        client.infrastructure?.total_storage_gb?.toString() || "",
        client.infrastructure?.used_storage_gb?.toString() || "",
        client.infrastructure?.storage_usage_percentage?.toString() || "",
        client.infrastructure?.windows_workstation_version || "",
        client.infrastructure?.windows_workstation_count?.toString() || "",
        client.infrastructure?.sql_manager_version || "",
        client.infrastructure?.sql_manager_status || "",
        client.infrastructure?.sql_manager_databases?.toString() || "",
        client.infrastructure?.compatibility_level || "",
        client.infrastructure?.compatibility_status || "",
        client.infrastructure?.anydesk || "",
        client.infrastructure?.vpn || "",
        client.infrastructure?.executable_version || "",
        client.infrastructure?.last_scan || "",
      ])

      return ["CLIENTES E INFRAESTRUCTURA", headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
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

  // Filtra los clientes disponibles según el término de búsqueda
  const filteredAvailableClients = availableClients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(clientSearchTerm.toLowerCase())),
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <p className="text-gray-600">Genera y descarga informes detallados</p>
        </div>
        <Button onClick={() => setShowCustomDialog(true)}>
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
      <Dialog
        open={showCustomDialog}
        onOpenChange={(open) => {
          setShowCustomDialog(open)
          if (open) {
            loadAvailableClients() // Cargar clientes al abrir el modal
          } else {
            resetCustomConfig() // Resetear configuración al cerrar el modal
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Reporte Personalizado</DialogTitle>
            <DialogDescription>Define los filtros y parámetros para generar un reporte específico</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
              <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
            </TabsList>

            {/* Pestaña General */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-clients"
                      checked={customConfig.includeClients}
                      onCheckedChange={(checked) => {
                        setCustomConfig((prev) => ({ ...prev, includeClients: checked as boolean }))
                        if (checked) {
                          loadAvailableClients() // Cargar clientes cuando se activa el checkbox
                        } else {
                          setSelectedClientIds([]) // Limpiar selección si se desactiva
                          setClientSearchTerm("") // Limpiar búsqueda si se desactiva
                        }
                      }}
                    />
                    <Label htmlFor="include-clients" className="text-sm">
                      Incluir información de clientes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-certificates"
                      checked={customConfig.includeCertificates}
                      onCheckedChange={(checked) =>
                        setCustomConfig((prev) => ({ ...prev, includeCertificates: checked as boolean }))
                      }
                    />
                    <Label htmlFor="include-certificates" className="text-sm">
                      Incluir información de certificados
                    </Label>
                  </div>

                  {customConfig.includeClients && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-medium">Seleccionar Clientes Específicos</Label>
                      <div>
                        <Input
                          placeholder="Buscar cliente por nombre o empresa..."
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                        {filteredAvailableClients.length > 0 ? (
                          filteredAvailableClients.map((client) => (
                            <div key={client.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`client-${client.id}`}
                                checked={selectedClientIds.includes(client.id)}
                                onCheckedChange={(checked) => handleClientSelection(client.id, checked as boolean)}
                              />
                              <Label htmlFor={`client-${client.id}`} className="text-sm font-normal flex-1">
                                {client.name} {client.company && `(${client.company})`}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No hay clientes que coincidan con la búsqueda.
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedClientIds.length} de {availableClients.length} clientes seleccionados
                      </p>
                    </div>
                  )}
                  {customConfig.includeClients && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-infrastructure"
                        checked={customConfig.filterInfrastructure}
                        onCheckedChange={(checked) =>
                          setCustomConfig((prev) => ({ ...prev, filterInfrastructure: checked as boolean }))
                        }
                      />
                      <Label htmlFor="filter-infrastructure" className="text-sm">
                        Aplicar filtros de infraestructura
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Pestaña Certificados */}
            <TabsContent value="certificates" className="space-y-4">
              {!customConfig.includeCertificates ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  La sección de certificados está deshabilitada. Activa "Incluir información de certificados" en la
                  pestaña General para usar estos filtros.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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
                            value={customConfig.daysThreshold || ""}
                            onChange={(e) =>
                              setCustomConfig((prev) => ({
                                ...prev,
                                daysThreshold: Number.parseInt(e.target.value) || 30,
                              }))
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
                  </div>
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
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Pestaña Infraestructura */}
            <TabsContent value="infrastructure" className="space-y-4">
              {!customConfig.includeClients ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  Para usar filtros de infraestructura, primero debes activar "Incluir información de clientes" en la
                  pestaña General.
                </div>
              ) : !customConfig.filterInfrastructure ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  Para usar filtros de infraestructura, primero debes activar "Aplicar filtros de infraestructura" en la
                  pestaña General.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="anydesk">AnyDesk ID</Label>
                      <Input
                        id="anydesk"
                        value={customConfig.anydesk}
                        onChange={(e) => setCustomConfig((prev) => ({ ...prev, anydesk: e.target.value }))}
                        placeholder="ID o parte del ID de AnyDesk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sql-manager">SQL Manager</Label>
                      <Select
                        value={customConfig.sqlManager}
                        onValueChange={(value) => setCustomConfig((prev) => ({ ...prev, sqlManager: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un gestor SQL" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cualquiera</SelectItem>
                          {sqlManagerOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Almacenamiento (GB)</Label>
                      <div className="grid grid-cols-2 gap-4 mt-1">
                        <div>
                          <Label htmlFor="storage-min" className="text-xs">
                            Mínimo
                          </Label>
                          <Input
                            id="storage-min"
                            type="number"
                            value={customConfig.storageMin !== null ? customConfig.storageMin : ""}
                            onChange={(e) =>
                              setCustomConfig((prev) => ({
                                ...prev,
                                storageMin: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="Min"
                          />
                        </div>
                        <div>
                          <Label htmlFor="storage-max" className="text-xs">
                            Máximo
                          </Label>
                          <Input
                            id="storage-max"
                            type="number"
                            value={customConfig.storageMax !== null ? customConfig.storageMax : ""}
                            onChange={(e) =>
                              setCustomConfig((prev) => ({
                                ...prev,
                                storageMax: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="compatibility-level">Nivel de Compatibilidad</Label>
                      <Select
                        value={customConfig.compatibilityLevel}
                        onValueChange={(value) => setCustomConfig((prev) => ({ ...prev, compatibilityLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cualquiera</SelectItem>
                          {compatibilityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="executable-version">Versión Ejecutable</Label>
                      <Input
                        id="executable-version"
                        value={customConfig.executableVersion}
                        onChange={(e) => setCustomConfig((prev) => ({ ...prev, executableVersion: e.target.value }))}
                        placeholder="Ej: 1.2.345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="antivirus">Antivirus</Label>
                      <Select
                        value={customConfig.antivirus}
                        onValueChange={(value) => setCustomConfig((prev) => ({ ...prev, antivirus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un antivirus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cualquiera</SelectItem>
                          {antivirusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Computadoras Conectadas</Label>
                      <div className="grid grid-cols-2 gap-4 mt-1">
                        <div>
                          <Label htmlFor="min-computers" className="text-xs">
                            Mínimo
                          </Label>
                          <Input
                            id="min-computers"
                            type="number"
                            value={customConfig.minComputers !== null ? customConfig.minComputers : ""}
                            onChange={(e) =>
                              setCustomConfig((prev) => ({
                                ...prev,
                                minComputers: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="Min"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-computers" className="text-xs">
                            Máximo
                          </Label>
                          <Input
                            id="max-computers"
                            type="number"
                            value={customConfig.maxComputers !== null ? customConfig.maxComputers : ""}
                            onChange={(e) =>
                              setCustomConfig((prev) => ({
                                ...prev,
                                maxComputers: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="windows-server-version">Versión de Windows Server</Label>
                      <Select
                        value={customConfig.windowsServerVersion}
                        onValueChange={(value) => setCustomConfig((prev) => ({ ...prev, windowsServerVersion: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una versión" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cualquiera</SelectItem>
                          {windowsServerOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={resetCustomConfig}>
              <X className="h-4 w-4 mr-2" />
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
