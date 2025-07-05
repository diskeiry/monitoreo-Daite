"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "./lib/supabase"

export default function DebugInfo() {
  const [connectionStatus, setConnectionStatus] = useState<string>("No probado")
  const [envVars, setEnvVars] = useState<any>({})

  const testConnection = async () => {
    try {
      setConnectionStatus("Probando...")

      // Verificar variables de entorno
      const env = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ No configurada",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ No configurada",
      }
      setEnvVars(env)

      // Probar conexión
      const { data, error } = await supabase.from("ssl_certificates").select("count").limit(1)

      if (error) {
        setConnectionStatus(`❌ Error: ${error.message}`)
      } else {
        setConnectionStatus("✅ Conexión exitosa")
      }
    } catch (error) {
      setConnectionStatus(`❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Debug - Información de Conexión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Variables de Entorno:</h4>
          <pre className="text-sm bg-gray-100 p-2 rounded">{JSON.stringify(envVars, null, 2)}</pre>
        </div>

        <div>
          <h4 className="font-semibold">Estado de Conexión:</h4>
          <p className="text-sm">{connectionStatus}</p>
        </div>

        <Button onClick={testConnection}>Probar Conexión</Button>
      </CardContent>
    </Card>
  )
}
