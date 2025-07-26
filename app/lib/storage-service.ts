import { supabase } from "./supabase"

export interface StorageDevice {
  id: string
  client_id: string
  device_name: string
  device_type: string
  total_capacity_gb: number
  file_system?: string
  health_status: string
  mount_point?: string
  created_at: string
  updated_at: string
}

export const DEVICE_TYPES = {
  HDD: "HDD",
  SSD: "SSD",
  NVME: "NVMe",
  HYBRID: "Hybrid",
  NETWORK: "Network",
} as const

export const HEALTH_STATUS = {
  EXCELLENT: "Excelente",
  GOOD: "Bueno",
  WARNING: "Advertencia",
  CRITICAL: "Crítico",
  FAILED: "Fallido",
} as const

export const FILE_SYSTEMS = {
  NTFS: "NTFS",
  FAT32: "FAT32",
  EXFAT: "exFAT",
  EXT4: "ext4",
  XFS: "XFS",
  APFS: "APFS",
} as const

export async function getStorageDevicesByClient(clientId: string): Promise<StorageDevice[]> {
  try {
    const { data, error } = await supabase
      .from("storage_devices")
      .select("*")
      .eq("client_id", clientId)
      .order("device_name")

    if (error) {
      console.error("Error fetching storage devices:", error)
      throw new Error(`Error fetching storage devices: ${error.message}`)
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating storage device:", error)
      throw new Error(`Error creating storage device: ${error.message}`)
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
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating storage device:", error)
      throw new Error(`Error updating storage device: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in updateStorageDevice:", error)
    throw error
  }
}

export async function deleteStorageDevice(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("storage_devices").delete().eq("id", id)

    if (error) {
      console.error("Error deleting storage device:", error)
      throw new Error(`Error deleting storage device: ${error.message}`)
    }
  } catch (error) {
    console.error("Error in deleteStorageDevice:", error)
    throw error
  }
}

export async function getStorageStatsByClient(clientId: string) {
  try {
    const devices = await getStorageDevicesByClient(clientId)

    const stats = {
      totalDevices: devices.length,
      totalCapacity: devices.reduce((sum, device) => sum + device.total_capacity_gb, 0),
      deviceTypes: devices.reduce(
        (acc, device) => {
          acc[device.device_type] = (acc[device.device_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      healthStatus: devices.reduce(
        (acc, device) => {
          acc[device.health_status] = (acc[device.health_status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return stats
  } catch (error) {
    console.error("Error in getStorageStatsByClient:", error)
    throw error
  }
}

export async function getAllStorageDevices(): Promise<StorageDevice[]> {
  try {
    const { data, error } = await supabase.from("storage_devices").select("*").order("device_name")

    if (error) {
      console.error("Error fetching all storage devices:", error)
      throw new Error(`Error fetching all storage devices: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllStorageDevices:", error)
    throw error
  }
}
