"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Search,
  Building2,
  Monitor,
  Server,
  Shield,
  HardDrive,
  MemoryStick,
  Database,
  Settings,
  Eye,
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
} from "lucide-react"
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

export default function ClientsScreen() {
  const [clients, setClients] = useState<ClientWithInfrastructure[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientWithInfrastructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isInfraDialogOpen, setIsInfraDialogOpen] = useState(false)
  const { toast } = useToast()

  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  })

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [infrastructureData, setInfrastructureData] = useState<Partial<ClientInfrastructure>>({})


  useEffect(() => {
    loadClients()
  }, [])

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

  const handleAddClient = async () => {
    try {
      if (!newClient.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es requerido",
          variant: "destructive",
        })
        return
      }

      await createClient({
        ...newClient,
        is_active: true,
      })

      toast({
        title: "Éxito",
        description: "Cliente agregado correctamente",
      })

      setNewClient({
        name: "",
        company: "",
        contact_email: "",
        contact_phone: "",
        address: "",
      })
      setIsAddDialogOpen(false)
      loadClients()
    } catch (error) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleEditClient = async () => {
    try {
      if (!editingClient || !editingClient.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es requerido",
          variant: "destructive",
        })
        return
      }

      await updateClient(editingClient.id, editingClient)

      toast({
        title: "Éxito",
        description: "Cliente actualizado correctamente",
      })

      setEditingClient(null)
      setIsEditDialogOpen(false)
      loadClients()
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId)
      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
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

  const handleUpdateInfrastructure = async () => {

    try {
      if (!selectedClient) return

      await updateClientInfrastructure(selectedClient.id, infrastructureData)

      toast({
        title: "Éxito",
        description: "Infraestructura actualizada correctamente",
      })

      setInfrastructureData({})
      setIsInfraDialogOpen(false)
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

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "activo":
      case "actualizado":
      case "compatible":
        return "bg-green-500"
      case "inactivo":
      case "desactualizado":
      case "incompatible":
        return "bg-red-500"
      case "advertencia":
      case "pendiente":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getColorByCompatibilityLevel = (level?: number) => {
  if (level === undefined || level === null) return "bg-gray-500";

  if (level <= 120) return "bg-red-500";
  if (level >= 130 && level <= 140) return "bg-yellow-500";
  if (level >= 150 && level <= 160) return "bg-green-500";

  return "bg-gray-500"; // fuera de rango definido
};
const getCompatibilityLabel = (level?: number) => {
  if (level === undefined || level === null) return "Desconocido";

  if (level <= 120) return "Baja";
  if (level >= 130 && level <= 140) return "Media";
  if (level >= 150 && level <= 160) return "Alta";

  return "Desconocido"; // fuera de rango definido
};



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra clientes y su infraestructura tecnológica</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>Ingresa la información del nuevo cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.contact_email}
                  onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newClient.contact_phone}
                  onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddClient}>Agregar Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de clientes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.company && <CardDescription>{client.company}</CardDescription>}
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingClient(client)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.contact_email && <p className="text-sm text-gray-600">{client.contact_email}</p>}
                {client.infrastructure && (
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{client.infrastructure.total_computers || 0} computadoras</span>
                  </div>
                )}
                <div className="flex space-x-2 mt-2">
                  <Badge variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    Cliente
                  </Badge>
                  {client.infrastructure && (
                    <Badge variant="secondary">
                      <Activity className="h-3 w-3 mr-1" />
                      Monitoreado
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de detalles del cliente */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>{selectedClient.name}</span>
              </DialogTitle>
              <DialogDescription>Información detallada del cliente y su infraestructura</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información General</TabsTrigger>
                <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Datos del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="font-medium">Nombre:</Label>
                      <p>{selectedClient.name}</p>
                    </div>
                    {selectedClient.company && (
                      <div>
                        <Label className="font-medium">Empresa:</Label>
                        <p>{selectedClient.company}</p>
                      </div>
                    )}
                    {selectedClient.contact_email && (
                      <div>
                        <Label className="font-medium">Email:</Label>
                        <p>{selectedClient.contact_email}</p>
                      </div>
                    )}
                    {selectedClient.contact_phone && (
                      <div>
                        <Label className="font-medium">Teléfono:</Label>
                        <p>{selectedClient.contact_phone}</p>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div>
                        <Label className="font-medium">Dirección:</Label>
                        <p>{selectedClient.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="infrastructure" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Infraestructura Tecnológica</h3>
                  <Button
                    onClick={() => {
                      setInfrastructureData(selectedClient.infrastructure || {})
                      setIsInfraDialogOpen(true)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>

                {selectedClient.infrastructure ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Computadoras */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Monitor className="h-4 w-4 mr-2" />
                          Computadoras
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedClient.infrastructure.total_computers || 0}</div>
                        <p className="text-sm text-gray-600">Total conectadas</p>
                      </CardContent>
                    </Card>

                    {/* Windows Server */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Server className="h-4 w-4 mr-2" />
                          Windows Server
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(selectedClient.infrastructure.windows_server_status)}`}
                            ></div>
                            <span className="text-sm">
                              {selectedClient.infrastructure.windows_server_status || "Desconocido"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedClient.infrastructure.windows_server_version || "No especificado"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Antivirus */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Antivirus Server
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(selectedClient.infrastructure.antivirus_server_status)}`}
                            ></div>
                            <span className="text-sm">
                              {selectedClient.infrastructure.antivirus_server_status || "Desconocido"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedClient.infrastructure.antivirus_server_name || "No especificado"}
                          </p>
                          <p className="text-xs text-gray-500">
                            v{selectedClient.infrastructure.antivirus_server_version || "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Memoria RAM */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <MemoryStick className="h-4 w-4 mr-2" />
                          Memoria RAM
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{selectedClient.infrastructure.used_ram_gb || 0} GB</span>
                            <span>{selectedClient.infrastructure.total_ram_gb || 0} GB</span>
                          </div>
                          <Progress value={selectedClient.infrastructure.ram_usage_percentage || 0} className="h-2" />
                          <p className="text-xs text-gray-500">
                            <span className="text-xs text-gray-500">
                              {Number(selectedClient.infrastructure?.ram_usage_percentage || 0).toFixed(1)}% utilizado
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Almacenamiento */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <HardDrive className="h-4 w-4 mr-2" />
                          Almacenamiento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{selectedClient.infrastructure.used_storage_gb || 0} GB</span>
                            <span>{selectedClient.infrastructure.total_storage_gb || 0} GB</span>
                          </div>
                          <Progress
                            value={selectedClient.infrastructure.storage_usage_percentage || 0}
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500">
                            {Number(selectedClient.infrastructure?.storage_usage_percentage || 0).toFixed(1)}% utilizado
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SQL Manager */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Database className="h-4 w-4 mr-2" />
                          SQL Manager
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(selectedClient.infrastructure.sql_manager_status)}`}
                            ></div>
                            <span className="text-sm">
                              {selectedClient.infrastructure.sql_manager_status || "Desconocido"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedClient.infrastructure.sql_manager_version || "No especificado"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedClient.infrastructure.sql_manager_databases || 0} bases de datos
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Información adicional */}
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Información Adicional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Windows Workstation */}
                          <div>
                            <Label className="text-xs font-medium text-gray-500">Direcciones | Server</Label>
                            <p className="text-sm">
                              {selectedClient.infrastructure.windows_workstation_version || "No especificado"}
                            </p>
                            {/* <p className="text-xs text-gray-500">
                              {selectedClient.infrastructure.windows_workstation_count || 0} estaciones
                            </p> */}
                          </div>

                          {/* Compatibilidad */}
                          <div>
                            <Label className="text-xs font-medium text-gray-500">Compatibilidad</Label>
                            <div className="flex items-center space-x-2 text-sm mt-1">
                              <span>
                                {selectedClient.infrastructure.compatibility_level !== undefined
                                  ? selectedClient.infrastructure.compatibility_level
                                  : "No especificado"}
                              </span>
                              <div
                                className={`w-2 h-2 rounded-full ${getColorByCompatibilityLevel(
                                  Number(selectedClient.infrastructure.compatibility_level)
                                )}`}
                              ></div>
                              <span className="text-xs text-gray-500">
                                {getCompatibilityLabel(Number(selectedClient.infrastructure.compatibility_level))}
                              </span>
                            </div>
                          </div>
                          
                          {/* Versión Ejecutable */}
                          <div>
                            <Label className="text-xs font-medium text-gray-500">Versión Ejecutable</Label>
                            <p className="text-sm">
                              {selectedClient.infrastructure.executable_version || "No especificado"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sin datos de infraestructura</h3>
                      <p className="text-gray-600 mb-4">
                        No hay información de infraestructura registrada para este cliente.
                      </p>
                      <Button
                        onClick={() => {
                          setInfrastructureData({})
                          setIsInfraDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Información
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de edición de cliente */}
      {editingClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Modifica la información del cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={editingClient.company || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email de Contacto</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClient.contact_email || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={editingClient.contact_phone || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, contact_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Dirección</Label>
                <Textarea
                  id="edit-address"
                  value={editingClient.address || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditClient}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de actualización de infraestructura */}
      <Dialog open={isInfraDialogOpen} onOpenChange={setIsInfraDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Infraestructura</DialogTitle>
            <DialogDescription>Modifica la información de infraestructura del cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="total-computers">Total Computadoras</Label>
                <Input
                  id="total-computers"
                  type="number"
                  value={infrastructureData.total_computers || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      total_computers: Number.parseInt(e.target.value) || 0,
                    })
                  }
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
                  placeholder="Windows Server 2022"
                />
              </div>
              <div>
                <Label htmlFor="antivirus-name">Antivirus Server</Label>
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
                <Label htmlFor="antivirus-version">Versión Antivirus</Label>
                <Input
                  id="antivirus-version"
                  value={infrastructureData.antivirus_server_version || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      antivirus_server_version: e.target.value,
                    })
                  }
                  placeholder="4.18.2211.5"
                />
              </div>
              <div>
                <Label htmlFor="total-ram">RAM Total (GB)</Label>
                <Input
                  id="total-ram"
                  type="number"
                  value={infrastructureData.total_ram_gb || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      total_ram_gb: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="used-ram">RAM Utilizada (GB)</Label>
                <Input
                  id="used-ram"
                  type="number"
                  value={infrastructureData.used_ram_gb || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      used_ram_gb: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="total-storage">Almacenamiento Total (GB)</Label>
                <Input
                  id="total-storage"
                  type="number"
                  value={infrastructureData.total_storage_gb || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      total_storage_gb: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="used-storage">Almacenamiento Utilizado (GB)</Label>
                <Input
                  id="used-storage"
                  type="number"
                  value={infrastructureData.used_storage_gb || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      used_storage_gb: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sql-version">Versión SQL Manager</Label>
                <Input
                  id="sql-version"
                  value={infrastructureData.sql_manager_version || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      sql_manager_version: e.target.value,
                    })
                  }
                  placeholder="SQL Server 2022"
                />
              </div>
              <div>
                <Label htmlFor="compatibility-level">Nivel Compatibilidad</Label>
                <Input
                  id="compatibility-level"
                  value={infrastructureData.compatibility_level || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      compatibility_level: e.target.value,
                    })
                  }
                  placeholder="160"
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
                  placeholder="v2.1.5.2024"
                />
              </div>
              <div>
                <Label htmlFor="windows-workstation">Windows Workstation</Label>
                <Input
                  id="windows-workstation"
                  value={infrastructureData.windows_workstation_version || ""}
                  onChange={(e) =>
                    setInfrastructureData({
                      ...infrastructureData,
                      windows_workstation_version: e.target.value,
                    })
                  }
                  placeholder="Windows 11 Pro"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInfraDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateInfrastructure}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
