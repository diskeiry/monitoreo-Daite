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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
  Edit,
  Trash2,
  Activity,
  AlertTriangle,
  Plug,
  Save,
  RefreshCw,
  Thermometer,
  Disc,
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
import {
  getStorageDevicesByClient,
  createStorageDevice,
  updateStorageDevice,
  deleteStorageDevice,
  type StorageDevice,
  DEVICE_TYPES,
  HEALTH_STATUS,
  FILE_SYSTEMS,
} from "../lib/storage-service"

export default function ClientsScreen() {
  const [clients, setClients] = useState<ClientWithInfrastructure[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientWithInfrastructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isInfraDialogOpen, setIsInfraDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
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
  const [storageDevices, setStorageDevices] = useState<StorageDevice[]>([])
  const [isStorageDialogOpen, setIsStorageDialogOpen] = useState(false)
  const [editingStorage, setEditingStorage] = useState<StorageDevice | null>(null)
  const [newStorage, setNewStorage] = useState<Partial<StorageDevice>>({
    device_name: "",
    device_type: "SSD",
    total_capacity_gb: 0,
    mount_point: "",
    file_system: "NTFS",
    health_status: "healthy",
    is_system_drive: false,
    is_active: true,
  })

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadStorageDevices(selectedClient.id)
    }
  }, [selectedClient])

  // Calcular porcentajes automáticamente cuando cambien los valores
  useEffect(() => {
    if (infrastructureData.total_ram_gb && infrastructureData.used_ram_gb) {
      const ramPercentage = (infrastructureData.used_ram_gb / infrastructureData.total_ram_gb) * 100
      setInfrastructureData((prev) => ({
        ...prev,
        ram_usage_percentage: Math.min(100, Math.max(0, Math.round(ramPercentage * 100) / 100)),
      }))
    }
  }, [infrastructureData.total_ram_gb, infrastructureData.used_ram_gb])

  useEffect(() => {
    if (infrastructureData.total_storage_gb && infrastructureData.used_storage_gb) {
      const storagePercentage = (infrastructureData.used_storage_gb / infrastructureData.total_storage_gb) * 100
      setInfrastructureData((prev) => ({
        ...prev,
        storage_usage_percentage: Math.min(100, Math.max(0, Math.round(storagePercentage * 100) / 100)),
      }))
    }
  }, [infrastructureData.total_storage_gb, infrastructureData.used_storage_gb])

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

  const loadStorageDevices = async (clientId: string) => {
    try {
      const devices = await getStorageDevicesByClient(clientId)
      setStorageDevices(devices)
    } catch (error) {
      console.error("Error loading storage devices:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los dispositivos de almacenamiento",
        variant: "destructive",
      })
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

      // Validar email si se proporciona
      if (newClient.contact_email && !isValidEmail(newClient.contact_email)) {
        toast({
          title: "Error",
          description: "El formato del email no es válido",
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

      // Validar email si se proporciona
      if (editingClient.contact_email && !isValidEmail(editingClient.contact_email)) {
        toast({
          title: "Error",
          description: "El formato del email no es válido",
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
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      return
    }

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

      setIsUpdating(true)

      // Validaciones
      if (
        infrastructureData.used_ram_gb &&
        infrastructureData.total_ram_gb &&
        infrastructureData.used_ram_gb > infrastructureData.total_ram_gb
      ) {
        toast({
          title: "Error",
          description: "La RAM utilizada no puede ser mayor que la RAM total",
          variant: "destructive",
        })
        return
      }

      if (
        infrastructureData.used_storage_gb &&
        infrastructureData.total_storage_gb &&
        infrastructureData.used_storage_gb > infrastructureData.total_storage_gb
      ) {
        toast({
          title: "Error",
          description: "El almacenamiento utilizado no puede ser mayor que el total",
          variant: "destructive",
        })
        return
      }

      // Preparar datos con estados calculados
      const dataToUpdate = {
        ...infrastructureData,
        // Asegurar que los estados se establezcan correctamente
        windows_server_status:
          infrastructureData.windows_server_status ||
          (infrastructureData.windows_server_version ? "activo" : "inactivo"),
        antivirus_server_status:
          infrastructureData.antivirus_server_status ||
          (infrastructureData.antivirus_server_name ? "actualizado" : "desconocido"),
        sql_manager_status:
          infrastructureData.sql_manager_status || (infrastructureData.sql_manager_version ? "activo" : "inactivo"),
        compatibility_status:
          infrastructureData.compatibility_status || getCompatibilityStatus(infrastructureData.compatibility_level),
      }

      await updateClientInfrastructure(selectedClient.id, dataToUpdate)

      toast({
        title: "Éxito",
        description: "Infraestructura actualizada correctamente",
      })

      setInfrastructureData({})
      setIsInfraDialogOpen(false)
      loadClients()

      // Actualizar el cliente seleccionado
      const updatedClients = await getAllClients()
      const updatedClient = updatedClients.find((c) => c.id === selectedClient.id)
      if (updatedClient) {
        setSelectedClient(updatedClient)
      }
    } catch (error) {
      console.error("Error updating infrastructure:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la infraestructura",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddStorage = async () => {
    try {
      if (!selectedClient || !newStorage.device_name?.trim()) {
        toast({
          title: "Error",
          description: "El nombre del dispositivo es requerido",
          variant: "destructive",
        })
        return
      }

      if (!newStorage.total_capacity_gb || newStorage.total_capacity_gb <= 0) {
        toast({
          title: "Error",
          description: "La capacidad total debe ser mayor a 0",
          variant: "destructive",
        })
        return
      }

      await createStorageDevice({
        ...newStorage,
        client_id: selectedClient.id,
      } as Omit<StorageDevice, "id" | "created_at" | "updated_at">)

      toast({
        title: "Éxito",
        description: "Dispositivo de almacenamiento agregado correctamente",
      })

      setNewStorage({
        device_name: "",
        device_type: "SSD",
        total_capacity_gb: 0,
        mount_point: "",
        file_system: "NTFS",
        health_status: "healthy",
        is_system_drive: false,
        is_active: true,
      })
      setIsStorageDialogOpen(false)
      loadStorageDevices(selectedClient.id)
    } catch (error) {
      console.error("Error adding storage device:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el dispositivo de almacenamiento",
        variant: "destructive",
      })
    }
  }

  const handleEditStorage = async () => {
    try {
      if (!editingStorage) return

      if (!editingStorage.device_name?.trim()) {
        toast({
          title: "Error",
          description: "El nombre del dispositivo es requerido",
          variant: "destructive",
        })
        return
      }

      await updateStorageDevice(editingStorage.id, editingStorage)

      toast({
        title: "Éxito",
        description: "Dispositivo de almacenamiento actualizado correctamente",
      })

      setEditingStorage(null)
      if (selectedClient) {
        loadStorageDevices(selectedClient.id)
      }
    } catch (error) {
      console.error("Error updating storage device:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el dispositivo de almacenamiento",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStorage = async (storageId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este dispositivo de almacenamiento?")) {
      return
    }

    try {
      await deleteStorageDevice(storageId)
      toast({
        title: "Éxito",
        description: "Dispositivo de almacenamiento eliminado correctamente",
      })
      if (selectedClient) {
        loadStorageDevices(selectedClient.id)
      }
    } catch (error) {
      console.error("Error deleting storage device:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el dispositivo de almacenamiento",
        variant: "destructive",
      })
    }
  }

  const getDeviceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "ssd":
      case "nvme":
        return <Disc className="h-4 w-4 text-blue-500" />
      case "hdd":
        return <HardDrive className="h-4 w-4 text-gray-600" />
      case "network":
        return <Server className="h-4 w-4 text-purple-500" />
      case "usb":
        return <Plug className="h-4 w-4 text-orange-500" />
      default:
        return <HardDrive className="h-4 w-4 text-gray-500" />
    }
  }

  const getTotalStorageCapacity = () => {
    return storageDevices.reduce((sum, device) => sum + device.total_capacity_gb, 0)
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const getCompatibilityStatus = (level?: string) => {
    if (!level) return "desconocido"
    const numLevel = Number.parseInt(level)
    if (numLevel <= 120) return "incompatible"
    if (numLevel >= 130 && numLevel <= 140) return "advertencia"
    if (numLevel >= 150 && numLevel <= 160) return "compatible"
    return "desconocido"
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "activo":
      case "actualizado":
      case "compatible":
      case "healthy":
        return "bg-green-500"
      case "inactivo":
      case "desactualizado":
      case "incompatible":
      case "critical":
        return "bg-red-500"
      case "advertencia":
      case "pendiente":
      case "warning":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getColorByCompatibilityLevel = (level?: number) => {
    if (level === undefined || level === null) return "bg-gray-500"
    if (level <= 120) return "bg-red-500"
    if (level >= 130 && level <= 140) return "bg-yellow-500"
    if (level >= 150 && level <= 160) return "bg-green-500"
    return "bg-gray-500"
  }

  const getCompatibilityLabel = (level?: number) => {
    if (level === undefined || level === null) return "Desconocido"
    if (level <= 120) return "Baja"
    if (level >= 130 && level <= 140) return "Media"
    if (level >= 150 && level <= 160) return "Alta"
    return "Desconocido"
  }

  function getColorStyle(value: string | undefined | null) {
    const isActive = !!value && value.trim() !== ""
    return {
      dot: isActive ? "bg-green-500" : "bg-red-500",
      text: isActive ? "text-green-600" : "text-red-600",
      id: isActive ? value : "Desconocido",
    }
  }

  const handleClientCardClick = (client: ClientWithInfrastructure) => {
    setSelectedClient(client)
  }

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
          placeholder="Buscar clientes por nombre, empresa o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de clientes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleClientCardClick(client)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.company && <CardDescription>{client.company}</CardDescription>}
                </div>
                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
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

      {filteredClients.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
            <p className="text-gray-600">
              {searchTerm ? "No hay clientes que coincidan con tu búsqueda." : "Aún no tienes clientes registrados."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de detalles del cliente */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                    <div>
                      <Label className="font-medium">Fecha de registro:</Label>
                      <p>{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                    </div>
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
                            {Number(selectedClient.infrastructure?.ram_usage_percentage || 0).toFixed(1)}% utilizado
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

                    {/* Conexiones */}
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-2 pb-0">
                        <Plug className="w-5 h-5 text-primary" />
                        <h3 className="text-sm font-semibold text-primary">Conexiones</h3>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="space-y-3">
                          {/* Anydesk */}
                          {(() => {
                            const styles = getColorStyle(selectedClient.infrastructure?.anydesk)
                            return (
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                                  <span className={`text-sm font-semibold`}>Anydesk</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{styles.id}</p>
                              </div>
                            )
                          })()}
                          {/* VPN */}
                          {(() => {
                            const styles = getColorStyle(selectedClient.infrastructure?.vpn)
                            return (
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                                  <span className={`text-sm font-semibold`}>VPN</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{styles.id}</p>
                              </div>
                            )
                          })()}
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
                          {/* Direcciones | Server */}
                          <div>
                            <Label className="text-xs font-medium text-gray-500">Direcciones | Server</Label>
                            <p className="text-sm">
                              {selectedClient.infrastructure.windows_workstation_version || "No especificado"}
                            </p>
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
                                  Number(selectedClient.infrastructure.compatibility_level),
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
                        {selectedClient.infrastructure.last_scan && (
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-xs font-medium text-gray-500">Último escaneo:</Label>
                            <p className="text-sm">
                              {new Date(selectedClient.infrastructure.last_scan).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    {/* Dispositivos de Almacenamiento */}
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm flex items-center">
                            <HardDrive className="h-4 w-4 mr-2" />
                            Dispositivos de Almacenamiento
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={() => setIsStorageDialogOpen(true)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {storageDevices.length > 0 ? (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600 mb-3">
                              Capacidad Total: <span className="font-semibold">{getTotalStorageCapacity()} GB</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {storageDevices.map((device) => (
                                <div key={device.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                      {getDeviceTypeIcon(device.device_type)}
                                      <div>
                                        <p className="text-sm font-medium">{device.device_name}</p>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                                          <span>
                                            {device.device_type} • {device.mount_point}
                                          </span>
                                          {device.is_system_drive && (
                                            <Badge variant="secondary" className="ml-1 text-xs">
                                              Sistema
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                    </div>
                                    <div className="flex space-x-1">
                                      <Button variant="ghost" size="sm" onClick={() => setEditingStorage(device)}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteStorage(device.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{device.total_capacity_gb} GB</span>
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${getStatusColor(device.health_status)}`}
                                      ></div>
                                      <span className="text-xs">{device.health_status}</span>
                                      {device.temperature_celsius && (
                                        <div className="flex items-center space-x-1">
                                          <Thermometer className="h-3 w-3" />
                                          <span className="text-xs">{device.temperature_celsius}°C</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <HardDrive className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">Sin dispositivos registrados</p>
                            <Button variant="outline" size="sm" onClick={() => setIsStorageDialogOpen(true)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar Dispositivo
                            </Button>
                          </div>
                        )}
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar Infraestructura</DialogTitle>
            <DialogDescription>Modifica la información de infraestructura del cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="resources">Recursos</TabsTrigger>
                <TabsTrigger value="connections">Conexiones</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="total-computers">Total Computadoras</Label>
                    <Input
                      id="total-computers"
                      type="number"
                      min="0"
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
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="advertencia">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="antivirus-status">Estado Antivirus</Label>
                    <Select
                      value={infrastructureData.antivirus_server_status || ""}
                      onValueChange={(value) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          antivirus_server_status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actualizado">Actualizado</SelectItem>
                        <SelectItem value="desactualizado">Desactualizado</SelectItem>
                        <SelectItem value="advertencia">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="total-ram">RAM Total (GB)</Label>
                    <Input
                      id="total-ram"
                      type="number"
                      min="0"
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
                      min="0"
                      max={infrastructureData.total_ram_gb || undefined}
                      value={infrastructureData.used_ram_gb || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          used_ram_gb: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    {infrastructureData.ram_usage_percentage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {infrastructureData.ram_usage_percentage.toFixed(1)}% utilizado
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="total-storage">Almacenamiento Total (GB)</Label>
                    <Input
                      id="total-storage"
                      type="number"
                      min="0"
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
                      min="0"
                      max={infrastructureData.total_storage_gb || undefined}
                      value={infrastructureData.used_storage_gb || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          used_storage_gb: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    {infrastructureData.storage_usage_percentage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {infrastructureData.storage_usage_percentage.toFixed(1)}% utilizado
                      </p>
                    )}
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
                    <Label htmlFor="sql-status">Estado SQL Manager</Label>
                    <Select
                      value={infrastructureData.sql_manager_status || ""}
                      onValueChange={(value) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          sql_manager_status: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="advertencia">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sql-databases">Número de Bases de Datos</Label>
                    <Input
                      id="sql-databases"
                      type="number"
                      min="0"
                      value={infrastructureData.sql_manager_databases || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          sql_manager_databases: Number.parseInt(e.target.value) || 0,
                        })
                      }
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
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                      placeholder="1 844 444 421"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vpn">VPN</Label>
                    <Input
                      id="vpn"
                      value={infrastructureData.vpn || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          vpn: e.target.value,
                        })
                      }
                      placeholder="vpn.empresa.com"
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
                    <Label htmlFor="windows-workstation">Direcciones | Server</Label>
                    <Input
                      id="windows-workstation"
                      value={infrastructureData.windows_workstation_version || ""}
                      onChange={(e) =>
                        setInfrastructureData({
                          ...infrastructureData,
                          windows_workstation_version: e.target.value,
                        })
                      }
                      placeholder="192.168.1.100"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInfraDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateInfrastructure} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de agregar dispositivo de almacenamiento */}
      <Dialog open={isStorageDialogOpen} onOpenChange={setIsStorageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Dispositivo de Almacenamiento</DialogTitle>
            <DialogDescription>Registra un nuevo dispositivo de almacenamiento para el cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="device-name">Nombre del Dispositivo *</Label>
                <Input
                  id="device-name"
                  value={newStorage.device_name || ""}
                  onChange={(e) => setNewStorage({ ...newStorage, device_name: e.target.value })}
                  placeholder="Disco Principal"
                />
              </div>
              <div>
                <Label htmlFor="device-type">Tipo de Dispositivo</Label>
                <Select
                  value={newStorage.device_type || "SSD"}
                  onValueChange={(value) => setNewStorage({ ...newStorage, device_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="total-capacity">Capacidad Total (GB) *</Label>
                <Input
                  id="total-capacity"
                  type="number"
                  min="1"
                  value={newStorage.total_capacity_gb || ""}
                  onChange={(e) =>
                    setNewStorage({ ...newStorage, total_capacity_gb: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="mount-point">Punto de Montaje</Label>
                <Input
                  id="mount-point"
                  value={newStorage.mount_point || ""}
                  onChange={(e) => setNewStorage({ ...newStorage, mount_point: e.target.value })}
                  placeholder="C:, D:, /home"
                />
              </div>
              <div>
                <Label htmlFor="file-system">Sistema de Archivos</Label>
                <Select
                  value={newStorage.file_system || "NTFS"}
                  onValueChange={(value) => setNewStorage({ ...newStorage, file_system: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_SYSTEMS.map((fs) => (
                      <SelectItem key={fs.value} value={fs.value}>
                        {fs.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="health-status">Estado de Salud</Label>
                <Select
                  value={newStorage.health_status || "healthy"}
                  onValueChange={(value) => setNewStorage({ ...newStorage, health_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="temperature">Temperatura (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="100"
                  value={newStorage.temperature_celsius || ""}
                  onChange={(e) =>
                    setNewStorage({ ...newStorage, temperature_celsius: Number.parseInt(e.target.value) || undefined })
                  }
                  placeholder="42"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="system-drive"
                checked={newStorage.is_system_drive || false}
                onCheckedChange={(checked) => setNewStorage({ ...newStorage, is_system_drive: checked })}
              />
              <Label htmlFor="system-drive">Es disco del sistema</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStorageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStorage}>
              <Save className="h-4 w-4 mr-2" />
              Agregar Dispositivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de editar dispositivo de almacenamiento */}
      {editingStorage && (
        <Dialog open={!!editingStorage} onOpenChange={() => setEditingStorage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Dispositivo de Almacenamiento</DialogTitle>
              <DialogDescription>Modifica la información del dispositivo de almacenamiento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-device-name">Nombre del Dispositivo *</Label>
                  <Input
                    id="edit-device-name"
                    value={editingStorage.device_name || ""}
                    onChange={(e) => setEditingStorage({ ...editingStorage, device_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-device-type">Tipo de Dispositivo</Label>
                  <Select
                    value={editingStorage.device_type || "SSD"}
                    onValueChange={(value) => setEditingStorage({ ...editingStorage, device_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-total-capacity">Capacidad Total (GB) *</Label>
                  <Input
                    id="edit-total-capacity"
                    type="number"
                    min="1"
                    value={editingStorage.total_capacity_gb || ""}
                    onChange={(e) =>
                      setEditingStorage({ ...editingStorage, total_capacity_gb: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-mount-point">Punto de Montaje</Label>
                  <Input
                    id="edit-mount-point"
                    value={editingStorage.mount_point || ""}
                    onChange={(e) => setEditingStorage({ ...editingStorage, mount_point: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-file-system">Sistema de Archivos</Label>
                  <Select
                    value={editingStorage.file_system || "NTFS"}
                    onValueChange={(value) => setEditingStorage({ ...editingStorage, file_system: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_SYSTEMS.map((fs) => (
                        <SelectItem key={fs.value} value={fs.value}>
                          {fs.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-health-status">Estado de Salud</Label>
                  <Select
                    value={editingStorage.health_status || "healthy"}
                    onValueChange={(value) => setEditingStorage({ ...editingStorage, health_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-temperature">Temperatura (°C)</Label>
                  <Input
                    id="edit-temperature"
                    type="number"
                    min="0"
                    max="100"
                    value={editingStorage.temperature_celsius || ""}
                    onChange={(e) =>
                      setEditingStorage({
                        ...editingStorage,
                        temperature_celsius: Number.parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-system-drive"
                  checked={editingStorage.is_system_drive || false}
                  onCheckedChange={(checked) => setEditingStorage({ ...editingStorage, is_system_drive: checked })}
                />
                <Label htmlFor="edit-system-drive">Es disco del sistema</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStorage(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditStorage}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
