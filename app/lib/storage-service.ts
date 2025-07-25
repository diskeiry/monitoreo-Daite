import { supabase } from "./supabase"

export interface StorageDevice {
  id: string
  client_id: string
  device_name: string
  device_type: string
  total_capacity_gb: number
  mount_point?: string
  file_system?: string
  health_status: string
  temperature_celsius?: number
  is_system_drive: boolean
  is_active: boolean
  last_scan?: string
  created_at: string
  updated_at: string
}

export async function getStorageDevicesByClient(clientId: string): Promise<StorageDevice[]> {
  try {
    const { data, error } = await supabase
      .from("storage_devices")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("is_system_drive", { ascending: false })
      .order("device_name")

    if (error) {
      console.error("Error fetching storage devices:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getStorageDevicesByClient:", error)
    throw error
  }
}

export async function createStorageDevice(
  device: Omit<StorageDevice, "id" | "created_at" | "updated_at">,
): Promise<StorageDevice> {
  try {
    const { data, error } = await supabase
      .from("storage_devices")
      .insert([
        {
          ...device,
          last_scan: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating storage device:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createStorageDevice:", error)
    throw error
  }
}

export async function updateStorageDevice(id: string, updates: Partial<StorageDevice>): Promise<StorageDevice> {
  try {
    const { data, error } = await supabase
      .from("storage_devices")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_scan: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating storage device:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in updateStorageDevice:", error)
    throw error
  }
}

export async function deleteStorageDevice(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("storage_devices").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("Error deleting storage device:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in deleteStorageDevice:", error)
    throw error
  }
}

export const DEVICE_TYPES = [
  { value: "SSD", label: "SSD (Solid State Drive)" },
  { value: "HDD", label: "HDD (Hard Disk Drive)" },
  { value: "NVMe", label: "NVMe (Non-Volatile Memory)" },
  { value: "Network", label: "Almacenamiento en Red" },
  { value: "USB", label: "Dispositivo USB" },
  { value: "CD/DVD", label: "CD/DVD" },
  { value: "Other", label: "Otro" },
]

export const HEALTH_STATUS = [
  { value: "healthy", label: "Saludable", color: "bg-green-500" },
  { value: "warning", label: "Advertencia", color: "bg-yellow-500" },
  { value: "critical", label: "Crítico", color: "bg-red-500" },
  { value: "unknown", label: "Desconocido", color: "bg-gray-500" },
]

export const FILE_SYSTEMS = [
  { value: "NTFS", label: "NTFS" },
  { value: "FAT32", label: "FAT32" },
  { value: "exFAT", label: "exFAT" },
  { value: "ext4", label: "ext4" },
  { value: "ext3", label: "ext3" },
  { value: "APFS", label: "APFS" },
  { value: "HFS+", label: "HFS+" },
  { value: "SMB", label: "SMB/CIFS" },
  { value: "NFS", label: "NFS" },
]
