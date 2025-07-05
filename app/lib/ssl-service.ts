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
  try {
    const { data, error } = await supabase.from("ssl_certificates").select("*").order("domain", { ascending: true })

    if (error) {
      console.error("Error fetching certificates:", error)
      throw new Error("Error al obtener los certificados")
    }

    return data.map(dbToClient)
  } catch (error) {
    console.error("Error in getAllCertificates:", error)
    throw error
  }
}

// Crear un nuevo certificado
export const createCertificate = async (
  certificate: Omit<SSLClient, "id" | "daysUntilExpiration" | "createdAt" | "updatedAt">,
): Promise<SSLClient> => {
  try {
    console.log("Creando certificado con datos:", certificate)

    const insertData: SSLCertificateInsert = {
      domain: certificate.domain,
      type: certificate.type,
      status: certificate.status,
      expiration_date: certificate.expirationDate.toISOString(),
      description: certificate.description || null,
    }

    console.log("Datos para insertar:", insertData)

    const { data, error } = await supabase.from("ssl_certificates").insert(insertData).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      if (error.code === "23505") {
        throw new Error("Ya existe un certificado con este dominio")
      }
      if (error.code === "42501") {
        throw new Error("No tienes permisos para crear certificados")
      }
      throw new Error(`Error al crear el certificado: ${error.message}`)
    }

    if (!data) {
      throw new Error("No se recibieron datos del certificado creado")
    }

    console.log("Certificado creado exitosamente:", data)
    return dbToClient(data)
  } catch (error) {
    console.error("Error en createCertificate:", error)
    throw error
  }
}

// Actualizar un certificado
export const updateCertificate = async (
  id: string,
  updates: Partial<Omit<SSLClient, "id" | "daysUntilExpiration" | "createdAt" | "updatedAt">>,
): Promise<SSLClient> => {
  try {
    console.log("Actualizando certificado:", id, updates)

    const updateData: SSLCertificateUpdate = {}

    if (updates.domain) updateData.domain = updates.domain
    if (updates.type) updateData.type = updates.type
    if (updates.status) updateData.status = updates.status
    if (updates.expirationDate) updateData.expiration_date = updates.expirationDate.toISOString()
    if (updates.description !== undefined) updateData.description = updates.description || null

    console.log("Datos para actualizar:", updateData)

    const { data, error } = await supabase.from("ssl_certificates").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      if (error.code === "23505") {
        throw new Error("Ya existe un certificado con este dominio")
      }
      throw new Error(`Error al actualizar el certificado: ${error.message}`)
    }

    if (!data) {
      throw new Error("No se recibieron datos del certificado actualizado")
    }

    console.log("Certificado actualizado exitosamente:", data)
    return dbToClient(data)
  } catch (error) {
    console.error("Error en updateCertificate:", error)
    throw error
  }
}

// Eliminar un certificado
export const deleteCertificate = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("ssl_certificates").delete().eq("id", id)

    if (error) {
      console.error("Error deleting certificate:", error)
      throw new Error("Error al eliminar el certificado")
    }
  } catch (error) {
    console.error("Error en deleteCertificate:", error)
    throw error
  }
}

// Obtener certificados próximos a vencer
export const getCertificatesExpiringSoon = async (days = 30): Promise<SSLClient[]> => {
  try {
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
  } catch (error) {
    console.error("Error en getCertificatesExpiringSoon:", error)
    throw error
  }
}

// Función para verificar el estado real de un certificado SSL (opcional)
export const checkRealSSLStatus = async (
  domain: string,
): Promise<{
  isValid: boolean
  expirationDate?: Date
  issuer?: string
  error?: string
}> => {
  try {
    // Esta función podría implementarse para verificar el estado real del SSL
    // Por ahora retorna un placeholder
    console.log(`Verificando SSL real para ${domain}`)

    // En una implementación real, aquí harías una llamada a una API
    // que verifique el certificado SSL del dominio

    return {
      isValid: true,
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días desde ahora
      issuer: "Let's Encrypt",
    }
  } catch (error) {
    console.error("Error verificando SSL real:", error)
    return {
      isValid: false,
      error: "Error al verificar el certificado SSL",
    }
  }
}
