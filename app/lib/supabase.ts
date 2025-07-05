import { createClient } from "@supabase/supabase-js"


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      ssl_certificates: {
        Row: {
          id: string
          domain: string
          type: "APP MOVIL" | "PAGINAS"
          status: string
          expiration_date: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          domain: string
          type: "APP MOVIL" | "PAGINAS"
          status?: string
          expiration_date: string
          description?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          domain?: string
          type?: "APP MOVIL" | "PAGINAS"
          status?: string
          expiration_date?: string
          description?: string | null
          updated_by?: string | null
        }
      }
    }
  }
}
