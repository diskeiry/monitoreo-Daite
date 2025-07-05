"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllCertificates } from "../lib/ssl-service"

interface CalendarEvent {
  date: string
  title: string
  type: "critical" | "warning" | "info"
  days: number
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    scheduled: 0,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const certificates = await getAllCertificates()
      const now = new Date()

      // Convertir certificados a eventos de calendario
      const calendarEvents: CalendarEvent[] = []
      let critical = 0
      let warning = 0

      certificates.forEach((cert) => {
        const days = Math.ceil((cert.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const date = cert.expirationDate.toISOString().split("T")[0]

        if (days <= 7) {
          calendarEvents.push({
            date,
            title: `Vencimiento: ${cert.domain}`,
            type: "critical",
            days,
          })
          critical++
        } else if (days <= 30) {
          calendarEvents.push({
            date,
            title: `Vencimiento: ${cert.domain}`,
            type: "warning",
            days,
          })
          warning++
        }
      })

      // Agregar algunos eventos programados
      calendarEvents.push({
        date: "2024-12-05",
        title: "Renovación programada: coopsantiago.com",
        type: "info",
        days: 20,
      })

      // Ordenar por días restantes
      calendarEvents.sort((a, b) => a.days - b.days)

      setEvents(calendarEvents)
      setStats({
        critical,
        warning,
        scheduled: 2, // Valor fijo para demo
      })
    } catch (error) {
      console.error("Error loading calendar events:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-pulse text-blue-500 mx-auto mb-2" />
          <p>Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
        <p className="text-gray-600">Vencimientos y eventos programados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay eventos próximos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div
                        className={`p-2 rounded-full ${
                          event.type === "critical"
                            ? "bg-red-100 text-red-600"
                            : event.type === "warning"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {event.type === "critical" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.date}</p>
                      </div>
                      <Badge variant={event.type === "critical" ? "destructive" : "secondary"}>{event.days} días</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-red-600">Vencimientos críticos</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
                <div className="text-sm text-yellow-600">Próximos a vencer</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.scheduled}</div>
                <div className="text-sm text-green-600">Renovaciones programadas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
