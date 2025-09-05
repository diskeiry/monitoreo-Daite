"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Building, Users, Server, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  updateClientInfrastructure,
  type Client,
  type ClientWithInfrastructure,
  type ClientInfrastructure,
} from "../lib/clients-service"

interface ClientsProps {
  initialClientId?: string | null
  initialTab?: string | null
  onNavigationConsumed?: () => void
}

export default function Clients({ initialClientId, initialTab, onNavigationConsumed }: ClientsProps) {
  const [clients, setClients] = useState<ClientWithInfrastructure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithInfrastructure | null>(null)
  const [formData, setFormData] = useState<Partial<Client>>({})
  const [infrastructureData, setInfrastructureData] = useState<Partial<ClientInfrastructure>>({})
  const [activeEditTab, setActiveEditTab] = useState("general")
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  // Effect to handle initial navigation props
  useEffect(() => {
    if (initialClientId && clients.length > 0) {
      const clientToEdit = clients.find((c) => c.id === initialClientId)
      if (clientToEdit) {
        handleEditClick(clientToEdit, initialTab || "general")
        // Consume the navigation props after handling them
        if (onNavigationConsumed) {
          onNavigationConsumed()
        }
      }
    }
  }, [initialClientId, initialTab, clients, onNavigationConsumed]) // Depend on clients to ensure data is loaded

  const loadClients = async () => {
    try {
      setLoading(true)
      const data = await getAllClients()
      setClients(data)
    } catch (error) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async () => {
    try {
      if (!formData.name?.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es requerido",
          variant: "destructive",
        })
        return
      }

      await createClient({
        name: formData.name,
        company: formData.company || "",
        contact_email: formData.contact_email || "",
        contact_phone: formData.contact_phone || "",
        address: formData.address || "",
        is_active: true,
      })

      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado correctamente",
      })

      setShowCreateDialog(false)
      setFormData({})
      loadClients()
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      })
    }
  }

  const handleUpdateClient = async () => {
    try {
      if (!selectedClient?.id || !formData.name?.trim()) {
        toast({
          title: "Error",
          description: "Datos del cliente inválidos",
          variant: "destructive",
        })
        return
      }

      await updateClient(selectedClient.id, {
        name: formData.name,
        company: formData.company || "",
        contact_email: formData.contact_email || "",
        contact_phone: formData.contact_phone || "",
        address: formData.address || "",
      })

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado correctamente",
      })

      // Only close dialog and reset if the update was for the general tab
      if (activeEditTab === "general") {
        setShowEditDialog(false)
        setSelectedClient(null)
        setFormData({})
      }
      loadClients() // Reload clients to reflect changes
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleUpdateInfrastructure = async () => {
    try {
      if (!selectedClient?.id) {
        toast({
          title: "Error",
          description: "Cliente no seleccionado",
          variant: "destructive",
        })
        return
      }

      // Validaciones básicas
      if (infrastructureData.total_ram_gb && infrastructureData.used_ram_gb) {
        if (infrastructureData.used_ram_gb > infrastructureData.total_ram_gb) {
          toast({
            title: "Error de validación",
            description: "La RAM usada no puede ser mayor que la RAM total",
            variant: "destructive",
          })
          return
        }
      }

      if (infrastructureData.total_storage_gb && infrastructureData.used_storage_gb) {
        if (infrastructureData.used_storage_gb > infrastructureData.total_storage_gb) {
          toast({
            title: "Error de validación",
            description: "El almacenamiento usado no puede ser mayor que el almacenamiento total",
            variant: "destructive",
          })
          return
        }
      }

      await updateClientInfrastructure(selectedClient.id, infrastructureData)

      toast({
        title: "Infraestructura actualizada",
        description: "Los datos de infraestructura se han actualizado correctamente",
      })

      setShowEditDialog(false) // Close dialog after infrastructure update
      setSelectedClient(null)
      setFormData({})
      setInfrastructureData({})
      setActiveEditTab("general") // Reset tab
      loadClients()
    } catch (error) {
      console.error("Error updating infrastructure:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la infraestructura",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId)
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente",
      })
      loadClients()
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleClientCardClick = (client: ClientWithInfrastructure) => {
    setSelectedClient(client)
    setShowDetailsDialog(true)
  }

  const handleEditClick = (client: ClientWithInfrastructure, tabToOpen = "general") => {
    setSelectedClient(client)
    setFormData({
      name: client.name,
      company: client.company || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
      address: client.address || "",
    })
    setInfrastructureData(client.infrastructure || {})
    setActiveEditTab(tabToOpen) // Set the active tab based on parameter
    setShowEditDialog(true)
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.contact_email && client.contact_email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const resetForms = () => {
    setFormData({})
    setInfrastructureData({})
    setSelectedClient(null)
    setActiveEditTab("general") // Reset tab on form close
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando clientes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de clientes e infraestructura</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredClients.length} clientes</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleClientCardClick(client)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.company && <p className="text-sm text-gray-600 mt-1">{client.company}</p>}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(client)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClient(client.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.contact_email && <p className="text-sm text-gray-600">📧 {client.contact_email}</p>}
                {client.contact_phone && <p className="text-sm text-gray-600">📞 {client.contact_phone}</p>}
                {client.infrastructure && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {client.infrastructure.total_computers || 0} PCs
                      </div>
                      <div className="flex items-center">
                        <Server className="h-3 w-3 mr-1" />
                        {client.infrastructure.total_ram_gb || 0}GB RAM
                      </div>
                      <div className="flex items-center">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {client.infrastructure.total_storage_gb || 0}GB
                      </div>
                      <div className="flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        {client.infrastructure.windows_server_version?.split(" ")[2] || "N/A"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para crear cliente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company || ""}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_email || ""}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.contact_phone || ""}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForms()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateClient}>Crear Cliente</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar cliente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente: {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company">Empresa</Label>
                  <Input
                    id="edit-company"
                    value={formData.company || ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Correo Electrónico</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.contact_email || ""}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    value={formData.contact_phone || ""}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-address">Dirección</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    resetForms()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateClient}>Actualizar Cliente</Button>
              </div>
            </TabsContent>

            <TabsContent value="infrastructure" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información del Servidor</h3>
                  <div>
                    <Label htmlFor="total-computers">Total de Computadoras</Label>
                    <Input
                      id="total-computers"
                      type="number"
                      value={infrastructureData.total_computers || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          total_computers: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="windows-server-version">Versión Windows Server</Label>
                    <Input
                      id="windows-server-version"
                      value={infrastructureData.windows_server_version || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          windows_server_version: e.target.value,
                        })
                      }
                      placeholder="Windows Server 2019"
                    />
                  </div>
                  <div>
                    <Label htmlFor="windows-server-status">Estado Windows Server</Label>
                    <Select
                      value={infrastructureData.windows_server_status || ""}
                      onValueChange={(value) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          windows_server_status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="antivirus-name">Nombre del Antivirus</Label>
                    <Input
                      id="antivirus-name"
                      value={infrastructureData.antivirus_server_name || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          antivirus_server_name: e.target.value,
                        })
                      }
                      placeholder="Windows Defender"
                    />
                  </div>
                  <div>
                    <Label htmlFor="antivirus-version">Versión del Antivirus</Label>
                    <Input
                      id="antivirus-version"
                      value={infrastructureData.antivirus_server_version || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          antivirus_server_version: e.target.value,
                        })
                      }
                      placeholder="4.18.2010.7"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recursos del Sistema</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total-ram">RAM Total (GB)</Label>
                      <Input
                        id="total-ram"
                        type="number"
                        step="0.1"
                        value={infrastructureData.total_ram_gb || ""}
                        onChange={(e) =>
                          setInfrastructureData({
                            ...infrastructureData,
                            total_ram_gb: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="32.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="used-ram">RAM Usada (GB)</Label>
                      <Input
                        id="used-ram"
                        type="number"
                        step="0.1"
                        value={infrastructureData.used_ram_gb || ""}
                        onChange={(e) =>
                          setInfrastructureData({
                            ...infrastructureData,
                            used_ram_gb: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="24.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total-storage">Almacenamiento Total (GB)</Label>
                      <Input
                        id="total-storage"
                        type="number"
                        step="0.1"
                        value={infrastructureData.total_storage_gb || ""}
                        onChange={(e) =>
                          setInfrastructureData({
                            ...infrastructureData,
                            total_storage_gb: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="1000.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="used-storage">Almacenamiento Usado (GB)</Label>
                      <Input
                        id="used-storage"
                        type="number"
                        step="0.1"
                        value={infrastructureData.used_storage_gb || ""}
                        onChange={(e) =>
                          setInfrastructureData({
                            ...infrastructureData,
                            used_storage_gb: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="750.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sql-manager-version">Versión SQL Manager</Label>
                    <Input
                      id="sql-manager-version"
                      value={infrastructureData.sql_manager_version || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          sql_manager_version: e.target.value,
                        })
                      }
                      placeholder="SQL Server 2019"
                    />
                  </div>
                  <div>
                    <Label htmlFor="compatibility-level">Nivel de Compatibilidad</Label>
                    <Select
                      value={infrastructureData.compatibility_level || ""}
                      onValueChange={(value) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          compatibility_level: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="110">110</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                        <SelectItem value="130">130</SelectItem>
                        <SelectItem value="140">140</SelectItem>
                        <SelectItem value="150">150</SelectItem>
                        <SelectItem value="160">160</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="anydesk">AnyDesk ID</Label>
                    <Input
                      id="anydesk"
                      value={infrastructureData.anydesk || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          anydesk: e.target.value,
                        })
                      }
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="executable-version">Versión Ejecutable</Label>
                    <Input
                      id="executable-version"
                      value={infrastructureData.executable_version || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          executable_version: e.target.value,
                        })
                      }
                      placeholder="2024.1.0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    resetForms()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateInfrastructure}>Actualizar Infraestructura</Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles del cliente */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente: {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Información General</TabsTrigger>
                <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Nombre</Label>
                    <p className="text-sm text-gray-600">{selectedClient.name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Empresa</Label>
                    <p className="text-sm text-gray-600">{selectedClient.company || "No especificada"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Correo Electrónico</Label>
                    <p className="text-sm text-gray-600">{selectedClient.contact_email || "No especificado"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Teléfono</Label>
                    <p className="text-sm text-gray-600">{selectedClient.contact_phone || "No especificado"}</p>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Dirección</Label>
                  <p className="text-sm text-gray-600">{selectedClient.address || "No especificada"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Fecha de Creación</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                </div>
              </TabsContent>

              <TabsContent value="infrastructure" className="space-y-4">
                {selectedClient.infrastructure ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Información del Servidor</h3>
                      <div>
                        <Label className="font-semibold">Total de Computadoras</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.total_computers || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Versión Windows Server</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.windows_server_version || "No especificada"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Estado Windows Server</Label>
                        <Badge
                          variant={
                            selectedClient.infrastructure.windows_server_status === "Activo" ? "default" : "secondary"
                          }
                        >
                          {selectedClient.infrastructure.windows_server_status || "No especificado"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="font-semibold">Antivirus</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.antivirus_server_name || "No especificado"}
                          {selectedClient.infrastructure.antivirus_server_version &&
                            ` (${selectedClient.infrastructure.antivirus_server_version})`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Recursos del Sistema</h3>
                      <div>
                        <Label className="font-semibold">RAM</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.used_ram_gb || 0}GB /{" "}
                          {selectedClient.infrastructure.total_ram_gb || 0}GB
                          {selectedClient.infrastructure.ram_usage_percentage &&
                            ` (${selectedClient.infrastructure.ram_usage_percentage.toFixed(1)}%)`}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Almacenamiento</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.used_storage_gb || 0}GB /{" "}
                          {selectedClient.infrastructure.total_storage_gb || 0}GB
                          {selectedClient.infrastructure.storage_usage_percentage &&
                            ` (${selectedClient.infrastructure.storage_usage_percentage.toFixed(1)}%)`}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">SQL Manager</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.sql_manager_version || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Nivel de Compatibilidad</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.compatibility_level || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">AnyDesk ID</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.anydesk || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Versión Ejecutable</Label>
                        <p className="text-sm text-gray-600">
                          {selectedClient.infrastructure.executable_version || "No especificada"}
                        </p>
                      </div>
                      {/* {selectedClient.infrastructure.last_scan && (
                        <div>
                          <Label className="font-semibold">Último Escaneo</Label>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedClient.infrastructure.last_scan).toLocaleString()}
                          </p>
                        </div>
                      )} */}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay información de infraestructura disponible</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setShowDetailsDialog(false)
                        handleEditClick(selectedClient, "infrastructure") // Pass 'infrastructure' tab
                      }}
                    >
                      Agregar Información de Infraestructura
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
