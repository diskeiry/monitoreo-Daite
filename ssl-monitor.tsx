"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  type SSLClient,
} from "../lib/ssl-service"

// Calcular días hasta expiración
const calculateDaysUntilExpiration = (expirationDate: Date): number => {
  const today = new Date()
  const diffTime = expirationDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Determinar el estado de prioridad basado en días restantes
const getPriorityStatus = (
  days: number,
): { color: string; bgColor: string; textColor: string; icon: any; label: string } => {
  if (days <= 7) {
    return {
      color: "destructive",
      bgColor: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      icon: AlertTriangle,
      label: "Crítico",
    }
  } else if (days <= 30) {
    return {
      color: "warning",
      bgColor: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700",
      icon: Clock,
      label: "Advertencia",
    }
  } else {
    return {
      color: "success",
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      icon: CheckCircle,
      label: "Seguro",
    }
  }
}

interface SSLFormData {
  domain: string
  type: "APP MOVIL" | "PAGINAS"
  status: string
  expirationDate: string
  description: string
}

const initialFormData: SSLFormData = {
  domain: "",
  type: "APP MOVIL",
  status: "ACTIVADO",
  expirationDate: "",
  description: "",
}

export default function SSLMonitor() {
  const [sslData, setSSLData] = useState<SSLClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "APP MOVIL" | "PAGINAS">("ALL")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "Crítico" | "Advertencia" | "Seguro">("ALL")

  // Estados para el CRUD
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<SSLClient | null>(null)
  const [formData, setFormData] = useState<SSLFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<SSLFormData>>({})
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  // Cargar datos iniciales
  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const certificates = await getAllCertificates()
      setSSLData(certificates)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar los certificados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Procesar datos con cálculos actualizados
  const processedData = useMemo(() => {
    return sslData.map((client) => ({
      ...client,
      daysUntilExpiration: calculateDaysUntilExpiration(client.expirationDate),
    }))
  }, [sslData])

  // Filtrar datos
  const filteredData = useMemo(() => {
    return processedData.filter((client) => {
      const matchesSearch = client.domain.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "ALL" || client.type === filterType
      const priorityStatus = getPriorityStatus(client.daysUntilExpiration)
      const matchesStatus = filterStatus === "ALL" || priorityStatus.label === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [processedData, searchTerm, filterType, filterStatus])

  // Estadísticas
  const stats = useMemo(() => {
    const critical = processedData.filter((c) => c.daysUntilExpiration <= 7).length
    const warning = processedData.filter((c) => c.daysUntilExpiration > 7 && c.daysUntilExpiration <= 30).length
    const safe = processedData.filter((c) => c.daysUntilExpiration > 30).length

    return { critical, warning, safe, total: processedData.length }
  }, [processedData])

  // Validar formulario
  const validateForm = (data: SSLFormData): Partial<SSLFormData> => {
    const errors: Partial<SSLFormData> = {}

    if (!data.domain.trim()) {
        errors.domain = "El dominio es requerido"
    } else {
        // Expresión regular mejorada que permite:
        // - Dominios con múltiples niveles (daite.com.do)
        // - Paths (/coopruamar)
        // - Sin protocolo (http/https)
        const domainRegex = /^([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?$/
        
        // Eliminamos http:// o https:// si están presentes
        const cleanDomain = data.domain.replace(/^https?:\/\//, '')
        
        if (!domainRegex.test(cleanDomain)) {
            errors.domain = "Formato de dominio inválido"
        }
    }

    if (!data.expirationDate) {
        errors.expirationDate = "La fecha de expiración es requerida"
    } else if (new Date(data.expirationDate) <= new Date()) {
        errors.expirationDate = "La fecha debe ser futura"
    }

    if (!data.status.trim()) {
        errors.status = "El estado es requerido"
    }

    return errors
}

  // Manejar cambios en el formulario
  const handleFormChange = (field: keyof SSLFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Abrir formulario para crear
  const handleCreate = () => {
    setEditingClient(null)
    setFormData(initialFormData)
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Abrir formulario para editar
  const handleEdit = (client: SSLClient) => {
    setEditingClient(client)
    setFormData({
      domain: client.domain,
      type: client.type,
      status: client.status,
      expirationDate: client.expirationDate.toISOString().slice(0, 16),
      description: client.description || "",
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)

      const certificateData = {
        domain: formData.domain,
        type: formData.type,
        status: formData.status,
        expirationDate: new Date(formData.expirationDate),
        description: formData.description || null,
      }

      if (editingClient) {
        // Actualizar
        await updateCertificate(editingClient.id, certificateData)
        toast({
          title: "Éxito",
          description: "Certificado actualizado correctamente",
        })
      } else {
        // Crear
        await createCertificate(certificateData)
        toast({
          title: "Éxito",
          description: "Certificado creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setEditingClient(null)
      setFormData(initialFormData)
      await loadCertificates() // Recargar datos
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el certificado",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Eliminar
  const handleDelete = async (id: string) => {
    try {
      await deleteCertificate(id)
      toast({
        title: "Éxito",
        description: "Certificado eliminado correctamente",
      })
      await loadCertificates() // Recargar datos
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el certificado",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Cargando certificados SSL...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Monitor de Certificados SSL
          </h1>
          <p className="text-gray-600">Sistema de monitoreo de vencimiento de certificados SSL</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Críticos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Advertencias</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Seguros</p>
                  <p className="text-2xl font-bold text-green-600">{stats.safe}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y botones de acción */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por dominio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="ALL">Todos los tipos</option>
                <option value="APP MOVIL">App Móvil</option>
                <option value="PAGINAS">Páginas</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="ALL">Todos los estados</option>
                <option value="Crítico">Crítico</option>
                <option value="Advertencia">Advertencia</option>
                <option value="Seguro">Seguro</option>
              </select>

              <Button
                variant="outline"
                onClick={loadCertificates}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>

              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar SSL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de certificados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredData.map((client) => {
            const priorityStatus = getPriorityStatus(client.daysUntilExpiration)
            const IconComponent = priorityStatus.icon

            return (
              <Card key={client.id} className={`${priorityStatus.bgColor} border-2 transition-all hover:shadow-lg`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">{client.domain}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {client.type}
                      </Badge>
                      <Badge variant={priorityStatus.color as any} className="flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {priorityStatus.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Vence:</span>
                    <span className="font-medium">{formatDate(client.expirationDate)}</span>
                  </div>

                  <div className={`text-sm font-medium ${priorityStatus.textColor}`}>
                    {client.daysUntilExpiration > 0
                      ? `${client.daysUntilExpiration} días restantes`
                      : client.daysUntilExpiration === 0
                        ? "Vence hoy"
                        : `Vencido hace ${Math.abs(client.daysUntilExpiration)} días`}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${client.status === "ACTIVADO" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium">{client.status}</span>
                  </div>

                  {client.description && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Descripción:</span> {client.description}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el certificado SSL de{" "}
                            <strong>{client.domain}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(client.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredData.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No se encontraron certificados que coincidan con los filtros aplicados.</p>
            </CardContent>
          </Card>
        )}

        {/* Modal para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Certificado SSL" : "Agregar Nuevo Certificado SSL"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Dominio *</Label>
                <Input
                  id="domain"
                  placeholder="ejemplo.com"
                  value={formData.domain}
                  onChange={(e) => handleFormChange("domain", e.target.value)}
                  className={formErrors.domain ? "border-red-500" : ""}
                />
                {formErrors.domain && <p className="text-sm text-red-500">{formErrors.domain}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) => handleFormChange("type", e.target.value)}
                >
                  <option value="APP MOVIL">App Móvil</option>
                  <option value="PAGINAS">Páginas</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Input
                  id="status"
                  placeholder="ACTIVADO"
                  value={formData.status}
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  className={formErrors.status ? "border-red-500" : ""}
                />
                {formErrors.status && <p className="text-sm text-red-500">{formErrors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Fecha de Expiración *</Label>
                <Input
                  id="expirationDate"
                  type="datetime-local"
                  value={formData.expirationDate}
                  onChange={(e) => handleFormChange("expirationDate", e.target.value)}
                  className={formErrors.expirationDate ? "border-red-500" : ""}
                />
                {formErrors.expirationDate && <p className="text-sm text-red-500">{formErrors.expirationDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción opcional del certificado..."
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editingClient ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
