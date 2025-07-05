"use client"

import { useState } from "react"
import { FileText, Download, Calendar, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAllCertificates } from "../lib/ssl-service"

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)
  const { toast } = useToast()

  const reports = [
    {
      id: 1,
      name: "Reporte Mensual de Certificados",
      description: "Estado general de todos los certificados SSL",
      date: "2024-11-01",
      status: "Completado",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Análisis de Vencimientos",
      description: "Certificados próximos a vencer en los próximos 30 días",
      date: "2024-11-15",
      status: "Generando",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Reporte de Seguridad",
      description: "Evaluación de seguridad de certificados SSL",
      date: "2024-10-28",
      status: "Completado",
      size: "3.1 MB",
    },
  ]

  const generateGeneralReport = async () => {
    try {
      setGenerating("general")
      const certificates = await getAllCertificates()

      // Simular generación de reporte
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Crear y descargar CSV
      const csvContent = generateCSV(certificates)
      downloadFile(csvContent, "reporte-general.csv", "text/csv")

      toast({
        title: "Reporte generado",
        description: "El reporte general se ha descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(null)
    }
  }

  const generateExpirationReport = async () => {
    try {
      setGenerating("expiration")
      const certificates = await getAllCertificates()

      // Filtrar certificados próximos a vencer
      const now = new Date()
      const expiring = certificates.filter((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return days <= 30
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const csvContent = generateCSV(expiring)
      downloadFile(csvContent, "reporte-vencimientos.csv", "text/csv")

      toast({
        title: "Reporte de vencimientos generado",
        description: "El reporte se ha descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    } finally {
      setGenerating(null)
    }
  }

  const generateCSV = (data: any[]) => {
    const headers = ["Dominio", "Tipo", "Estado", "Fecha de Vencimiento", "Días Restantes"]
    const rows = data.map((cert) => {
      const days = Math.ceil((cert.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return [cert.domain, cert.type, cert.status, cert.expirationDate.toLocaleDateString(), days.toString()]
    })

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <p className="text-gray-600">Genera y descarga informes detallados</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Reporte General</h3>
            <p className="text-sm text-gray-600 mb-4">Estado completo del sistema</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={generateGeneralReport}
              disabled={generating === "general"}
            >
              {generating === "general" ? "Generando..." : "Generar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Reporte de Vencimientos</h3>
            <p className="text-sm text-gray-600 mb-4">Certificados próximos a vencer</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={generateExpirationReport}
              disabled={generating === "expiration"}
            >
              {generating === "expiration" ? "Generando..." : "Generar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Filter className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Reporte Personalizado</h3>
            <p className="text-sm text-gray-600 mb-4">Configura filtros específicos</p>
            <Button variant="outline" className="w-full">
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-gray-600">{report.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">{report.date}</span>
                    <span className="text-xs text-gray-500">{report.size}</span>
                    <Badge variant={report.status === "Completado" ? "default" : "secondary"}>{report.status}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={report.status !== "Completado"}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
