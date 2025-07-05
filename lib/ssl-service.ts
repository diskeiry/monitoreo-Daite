import { supabase } from "./supabase"
import type { Database } from "./supabase"

type SSLCertificate = Database["public"]["Tables"]["ssl_certificates"]["Row"]
type SSLCertificateInsert = Database["public"]["Tables"]["ssl_certificates"]["Insert"]
type SSLCertificateUpdate = Database["public"]["Tables"]["ssl_certificates"]["Update"]

export interface SSLClient {
  id: string
  domain: string
  type: "APP MOVIL" | "PAGINAS"
  status: string
  expirationDate: Date
  daysUntilExpiration: number
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

// Convertir de base de datos a formato del cliente
const dbToClient = (dbRecord: SSLCertificate): SSLClient => ({
  id: dbRecord.id,
  domain: dbRecord.domain,
  type: dbRecord.type,
  status: dbRecord.status,
  expirationDate: new Date(dbRecord.expiration_date),
  daysUntilExpiration: 0, // Se calculará en el componente
  description: dbRecord.description,
  createdAt: new Date(dbRecord.created_at),
  updatedAt: new Date(dbRecord.updated_at),
})

// Obtener todos los certificados
export const getAllCertificates = async (): Promise<SSLClient[]> => {
  const { data, error } = await supabase.from("ssl_certificates").select("*").order("domain", { ascending: true })

  if (error) {
    console.error("Error fetching certificates:", error)
    throw new Error("Error al obtener los certificados")
  }

  return data.map(dbToClient)
}

// Crear un nuevo certificado
export const createCertificate = async (
  certificate: Omit<SSLClient, "id" | "daysUntilExpiration" | "createdAt" | "updatedAt">,
): Promise<SSLClient> => {
  const insertData: SSLCertificateInsert = {
    domain: certificate.domain,
    type: certificate.type,
    status: certificate.status,
    expiration_date: certificate.expirationDate.toISOString(),
    description: certificate.description || null,
  }

  const { data, error } = await supabase.from("ssl_certificates").insert(insertData).select().single()

  if (error) {
    console.error("Error creating certificate:", error)
    if (error.code === "23505") {
      throw new Error("Ya existe un certificado con este dominio")
    }
    throw new Error("Error al crear el certificado")
  }

  return dbToClient(data)
}

// Actualizar un certificado
export const updateCertificate = async (
  id: string,
  updates: Partial<Omit<SSLClient, "id" | "daysUntilExpiration" | "createdAt" | "updatedAt">>,
): Promise<SSLClient> => {
  const updateData: SSLCertificateUpdate = {
    ...(updates.domain && { domain: updates.domain }),
    ...(updates.type && { type: updates.type }),
    ...(updates.status && { status: updates.status }),
    ...(updates.expirationDate && { expiration_date: updates.expirationDate.toISOString() }),
    ...(updates.description !== undefined && { description: updates.description || null }),
  }

  const { data, error } = await supabase.from("ssl_certificates").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating certificate:", error)
    if (error.code === "23505") {
      throw new Error("Ya existe un certificado con este dominio")
    }
    throw new Error("Error al actualizar el certificado")
  }

  return dbToClient(data)
}

// Eliminar un certificado
export const deleteCertificate = async (id: string): Promise<void> => {
  const { error } = await supabase.from("ssl_certificates").delete().eq("id", id)

  if (error) {
    console.error("Error deleting certificate:", error)
    throw new Error("Error al eliminar el certificado")
  }
}

// Obtener certificados próximos a vencer
export const getCertificatesExpiringSoon = async (days = 30): Promise<SSLClient[]> => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from("ssl_certificates")
    .select("*")
    .lte("expiration_date", futureDate.toISOString())
    .order("expiration_date", { ascending: true })

  if (error) {
    console.error("Error fetching expiring certificates:", error)
    throw new Error("Error al obtener certificados próximos a vencer")
  }

  return data.map(dbToClient)
}
