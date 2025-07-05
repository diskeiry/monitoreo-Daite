"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getAllCertificates, createCertificate, updateCertificate, deleteCertificate } from "./lib/ssl-service"
import type { SSLClient } from "./lib/ssl-service"

export default function SSLMonitor() {
  const [certificates, setCertificates] = useState<SSLClient[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<SSLClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCertificate, setEditingCertificate] = useState<SSLClient | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    domain: "",
    type: "PAGINAS" as "APP MOVIL" | "PAGINAS",
    expirationDate: "",
    description: "",
  })

  useEffect(() => {
    loadCertificates()
  }, [])

  useEffect(() => {
    filterCertificates()
  }, [certificates, searchTerm, filterStatus])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const data = await getAllCertificates()
      setCertificates(data)
      console.log("Certificados cargados:", data.length)
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

  const filterCertificates = () => {
    let filtered = certificates

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (cert) =>
          cert.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por estado
    if (filterStatus !== "all") {
      const now = new Date()
      filtered = filtered.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        switch (filterStatus) {
          case "valid":
            return days > 30
          case "warning":
            return days > 0 && days <= 30
          case "expired":
            return days <= 0
          default:
            return true
        }
      })
    }

    setFilteredCertificates(filtered)
  }

  const resetForm = () => {
    setFormData({
      domain: "",
      type: "PAGINAS",
      expirationDate: "",
      description: "",
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.domain || !formData.expirationDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log("Creando certificado:", formData)

      const newCertificate = await createCertificate({
        domain: formData.domain,
        type: formData.type,
        status: "active",
        expirationDate: new Date(formData.expirationDate),
        description: formData.description || null,
      })

      console.log("Certificado creado:", newCertificate)

      setCertificates((prev) => [...prev, newCertificate])
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Éxito",
        description: "Certificado agregado correctamente",
      })
    } catch (error) {
      console.error("Error creating certificate:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el certificado",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (certificate: SSLClient) => {
    setEditingCertificate(certificate)
    setFormData({
      domain: certificate.domain,
      type: certificate.type,
      expirationDate: certificate.expirationDate.toISOString().split("T")[0],
      description: certificate.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCertificate || !formData.domain || !formData.expirationDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log("Actualizando certificado:", editingCertificate.id, formData)

      const updatedCertificate = await updateCertificate(editingCertificate.id, {
        domain: formData.domain,
        type: formData.type,
        expirationDate: new Date(formData.expirationDate),
        description: formData.description || null,
      })

      console.log("Certificado actualizado:", updatedCertificate)

      setCertificates((prev) => prev.map((cert) => (cert.id === editingCertificate.id ? updatedCertificate : cert)))
      setIsEditDialogOpen(false)
      setEditingCertificate(null)
      resetForm()

      toast({
        title: "Éxito",
        description: "Certificado actualizado correctamente",
      })
    } catch (error) {
      console.error("Error updating certificate:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el certificado",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (certificate: SSLClient) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el certificado para ${certificate.domain}?`)) {
      return
    }

    try {
      console.log("Eliminando certificado:", certificate.id)
      await deleteCertificate(certificate.id)

      setCertificates((prev) => prev.filter((cert) => cert.id !== certificate.id))

      toast({
        title: "Éxito",
        description: "Certificado eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting certificate:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el certificado",
        variant: "destructive",
      })
    }
  }

  const getStatusInfo = (certificate: SSLClient) => {
    const now = new Date()
    const days = Math.ceil((certificate.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return {
        status: "Vencido",
        color: "destructive" as const,
        icon: XCircle,
        days: Math.abs(days),
        text: `Vencido hace ${Math.abs(days)} días`,
      }
    } else if (days <= 7) {
      return {
        status: "Crítico",
        color: "destructive" as const,
        icon: AlertTriangle,
        days,
        text: `Vence en ${days} días`,
      }
    } else if (days <= 30) {
      return {
        status: "Advertencia",
        color: "secondary" as const,
        icon: AlertTriangle,
        days,
        text: `Vence en ${days} días`,
      }
    } else {
      return {
        status: "Válido",
        color: "default" as const,
        icon: CheckCircle,
        days,
        text: `Vence en ${days} días`,
      }
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Monitor SSL</h2>
          <p className="text-gray-600">Gestión de certificados SSL</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadCertificates} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Certificado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Certificado SSL</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Dominio *</Label>
                  <Input
                    id="domain"
                    placeholder="ejemplo.com"
                    value={formData.domain}
                    onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "APP MOVIL" | "PAGINAS") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGINAS">Páginas Web</SelectItem>
                      <SelectItem value="APP MOVIL">App Móvil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Fecha de Vencimiento *</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción opcional del certificado"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por dominio o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="valid">Válidos</SelectItem>
            <SelectItem value="warning">Advertencia</SelectItem>
            <SelectItem value="expired">Vencidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de certificados */}
      <div className="grid gap-4">
        {filteredCertificates.length > 0 ? (
          filteredCertificates.map((certificate) => {
            const statusInfo = getStatusInfo(certificate)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={certificate.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{certificate.domain}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{certificate.type}</Badge>
                          <Badge variant={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{statusInfo.text}</p>
                        {certificate.description && (
                          <p className="text-sm text-gray-500 mt-1">{certificate.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(certificate)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(certificate)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay certificados</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No se encontraron certificados con los filtros aplicados"
                  : "Comienza agregando tu primer certificado SSL"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Certificado
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Certificado SSL</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-domain">Dominio *</Label>
              <Input
                id="edit-domain"
                placeholder="ejemplo.com"
                value={formData.domain}
                onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "APP MOVIL" | "PAGINAS") => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGINAS">Páginas Web</SelectItem>
                  <SelectItem value="APP MOVIL">App Móvil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expirationDate">Fecha de Vencimiento *</Label>
              <Input
                id="edit-expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                placeholder="Descripción opcional del certificado"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
