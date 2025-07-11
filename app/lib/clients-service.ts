import { supabase } from "./supabase"

export interface Client {
  id: string
  name: string
  company?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface ClientInfrastructure {
  id: string
  client_id: string
  total_computers: number
  windows_server_version?: string
  windows_server_status?: string
  windows_server_last_update?: string
  antivirus_server_name?: string
  antivirus_server_version?: string
  antivirus_server_status?: string
  total_ram_gb?: number
  used_ram_gb?: number
  ram_usage_percentage?: number
  total_storage_gb?: number
  used_storage_gb?: number
  storage_usage_percentage?: number
  windows_workstation_version?: string
  windows_workstation_count?: number
  sql_manager_version?: string
  sql_manager_status?: string
  sql_manager_databases?: number
  compatibility_level?: string
  compatibility_status?: string
  executable_version?: string
  last_scan?: string
  created_at: string
  updated_at: string
}

export interface ClientWithInfrastructure extends Client {
  infrastructure?: ClientInfrastructure | null
}

export async function getAllClients(): Promise<ClientWithInfrastructure[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
          client_infrastructure_client_id_fkey(*)
      `)
      .eq("is_active", true)
      .order("name")

    if (error) throw error

    return (
      data?.map(client => ({
        ...client,
        infrastructure: client.client_infrastructure_client_id_fkey?.[0] || null,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching clients:", error)
    throw error
  }
}

export async function getClientById(id: string): Promise<ClientWithInfrastructure | null> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        client_infrastructure(*)
      `)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching client:", error)
      throw error
    }

    return data
      ? {
        ...data,
        infrastructure: data.client_infrastructure?.[0] || null,
      }
      : null
  } catch (error) {
    console.error("Error in getClientById:", error)
    throw error
  }
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
  try {
    const { data, error } = await supabase.from("clients").insert([client]).select().single()

    if (error) {
      console.error("Error creating client:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createClient:", error)
    throw error
  }
}


export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating client:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in updateClient:", error)
    throw error
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("clients").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("Error deleting client:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in deleteClient:", error)
    throw error
  }
}

export async function updateClientInfrastructure(
  clientId: string,
  infrastructure: Partial<ClientInfrastructure>,
): Promise<ClientInfrastructure> {
  try {
    const { data: columns, error: columnsError } = await supabase
      .rpc("get_columns_info", { table_name: "client_infrastructure" })

    const columnExists = columns?.some((col: any) => col.column_name === "last_scan")

    const now = new Date().toISOString()
    const updateData: any = {
      ...infrastructure,
      updated_at: now,
    }

    const { data: existingList, error: fetchError } = await supabase
      .from("client_infrastructure")
      .select("id")
      .eq("client_id", clientId)
      .limit(1)

    if (fetchError) throw fetchError

    const existing = existingList?.[0]

    if (existing) {
      if (
        columnExists &&
        (infrastructure.total_computers !== undefined ||
          infrastructure.windows_server_version !== undefined)
      ) {
        updateData.last_scan = now
      }

      const { data, error } = await supabase
        .from("client_infrastructure")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const insertData = {
        ...updateData,
        client_id: clientId,
      }

      if (columnExists) {
        insertData.last_scan = now
      }

      const { data, error } = await supabase
        .from("client_infrastructure")
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error in updateClientInfrastructure:", error)
    throw error
  }
}

export async function getInfrastructureHistory(clientId: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("infrastructure_history")
      .select("*")
      .eq("client_id", clientId)
      .order("scan_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching infrastructure history:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getInfrastructureHistory:", error)
    throw error
  }
}
