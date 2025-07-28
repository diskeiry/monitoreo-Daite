import { supabase } from "./supabase"

export interface Client {
  id: string
  name: string
  company?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientInfrastructure {
  id: string
  client_id: string
  total_computers?: number
  windows_server_version?: string
  windows_server_status?: string
  antivirus_server_name?: string
  antivirus_server_version?: string
  antivirus_server_status?: string
  total_ram_gb?: number
  used_ram_gb?: number
  ram_usage_percentage?: number
  total_storage_gb?: number
  used_storage_gb?: number
  storage_usage_percentage?: number
  sql_manager_version?: string
  sql_manager_status?: string
  sql_manager_databases?: number
  compatibility_level?: string
  compatibility_status?: string
  executable_version?: string
  windows_workstation_version?: string
  anydesk?: string
  vpn?: string
  last_scan?: string
  created_at: string
  updated_at: string
}

export interface ClientWithInfrastructure extends Client {
  infrastructure?: ClientInfrastructure
}

export async function getAllClients(): Promise<ClientWithInfrastructure[]> {
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (clientsError) {
    throw new Error(`Error fetching clients: ${clientsError.message}`)
  }

  const { data: infrastructure, error: infraError } = await supabase.from("client_infrastructure").select("*")

  if (infraError) {
    throw new Error(`Error fetching infrastructure: ${infraError.message}`)
  }

  // Transform data to include infrastructure as a single object
  const clientsWithInfrastructure: ClientWithInfrastructure[] = clients.map((client: Client) => {
    const clientInfra = infrastructure?.find((infra: ClientInfrastructure) => infra.client_id === client.id)
    return {
      ...client,
      infrastructure: clientInfra || undefined,
    }
  })

  return clientsWithInfrastructure
}

export async function createClient(clientData: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
  const { data, error } = await supabase.from("clients").insert([clientData]).select().single()

  if (error) {
    throw new Error(`Error creating client: ${error.message}`)
  }

  return data
}

export async function updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase.from("clients").update(clientData).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating client: ${error.message}`)
  }

  return data
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").update({ is_active: false }).eq("id", id)

  if (error) {
    throw new Error(`Error deleting client: ${error.message}`)
  }
}

export async function updateClientInfrastructure(
  clientId: string,
  infrastructureData: Partial<ClientInfrastructure>,
): Promise<ClientInfrastructure> {
  // First check if infrastructure exists
  const { data: existing, error: checkError } = await supabase
    .from("client_infrastructure")
    .select("id")
    .eq("client_id", clientId)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error(`Error checking infrastructure: ${checkError.message}`)
  }

  if (existing) {
    // Update existing infrastructure
    const { data, error } = await supabase
      .from("client_infrastructure")
      .update(infrastructureData)
      .eq("client_id", clientId)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating infrastructure: ${error.message}`)
    }

    return data
  } else {
    // Create new infrastructure
    const { data, error } = await supabase
      .from("client_infrastructure")
      .insert([{ ...infrastructureData, client_id: clientId }])
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating infrastructure: ${error.message}`)
    }

    return data
  }
}
