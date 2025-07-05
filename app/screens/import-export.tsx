"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Download, Database, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getAllCertificates, createCertificate } from "../lib/ssl-service"

export default function ImportExport() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos CSV",
        variant: "destructive",
      })
      return
    }

    try {
      setImporting(true)
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",")

      // Validar headers
      const expectedHeaders = ["domain", "type", "status", "expiration_date", "description"]
      if (!expectedHeaders.every((header) => headers.includes(header))) {
        throw new Error("Formato de archivo inválido")
      }

      // Procesar datos
      const certificates = lines.slice(1).map((line) => {
        const values = line.split(",")
        const cert: any = {}
        headers.forEach((header, index) => {
          cert[header.trim()] = values[index]?.trim()
        })
        return cert
      })

      // Importar certificados
      let imported = 0
      for (const cert of certificates) {
        try {
          await createCertificate({
            domain: cert.domain,
            type: cert.type as "APP MOVIL" | "PAGINAS",
            status: cert.status,
            expirationDate: new Date(cert.expiration_date),
            description: cert.description || null,
          })
          imported++
        } catch (error) {
          console.error(`Error importing ${cert.domain}:`, error)
        }
      }

      toast({
        title: "Importación completada",
        description: `Se importaron ${imported} de ${certificates.length} certificados`,
      })
    } catch (error) {
      toast({
        title: "Error de importación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const exportCSV = async () => {
    try {
      setExporting(true)
      const certificates = await getAllCertificates()

      const headers = ["domain", "type", "status", "expiration_date", "description"]
      const csvContent = [
        headers.join(","),
        ...certificates.map((cert) =>
          [cert.domain, cert.type, cert.status, cert.expirationDate.toISOString(), cert.description || ""].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificados-ssl-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportación completada",
        description: "Los datos se han exportado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const exportJSON = async () => {
    try {
      setExporting(true)
      const certificates = await getAllCertificates()

      const jsonContent = JSON.stringify(certificates, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificados-ssl-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportación completada",
        description: "Los datos se han exportado en formato JSON",
      })
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Importar/Exportar</h2>
        <p className="text-gray-600">Gestiona la importación y exportación de datos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">Arrastra un archivo CSV o haz clic para seleccionar</p>
              <Button variant="outline" onClick={handleFileSelect} disabled={importing}>
                {importing ? "Importando..." : "Seleccionar Archivo"}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p>Formatos soportados: CSV, JSON</p>
              <p>Tamaño máximo: 10MB</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button className="w-full justify-start" onClick={exportCSV} disabled={exporting}>
                <FileText className="h-4 w-4 mr-2" />
                {exporting ? "Exportando..." : "Exportar como CSV"}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={exportJSON} disabled={exporting}>
                <Database className="h-4 w-4 mr-2" />
                {exporting ? "Exportando..." : "Exportar como JSON"}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Exportar Reporte PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
