import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "../components/auth-provider"
import { DynamicTitle } from "@/components/DynamicTitle" // 👈 cliente separado

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  icons: "/daite.svg",
  title: "Daite - Monitor Clientes",
  description: "Dashboard completo para monitoreo de Clientes y certificados SSL con múltiples funcionalidades",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <DynamicTitle /> {/* 👈 componente cliente */}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
