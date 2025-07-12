"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function DynamicTitle() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    let title = "Daite - Monitor Clientes"

    if (pathname.startsWith("/dashboard")) {
      if (pathname === "/dashboard") {
        title = "Inicio - Dashboard"
      } else if (pathname.includes("settings")) {
        title = "Configuración - Dashboard"
      } else if (pathname.includes("clientes")) {
        title = "Clientes - Dashboard"
      } else {
        title = "Dashboard - Monitor Clientes"
      }
    }

    document.title = title
  }, [pathname])

  return null
}
