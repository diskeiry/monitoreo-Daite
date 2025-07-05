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
      user_roles: {
        Row: {
          id: string
          name: string
          description: string
          permissions: Record<string, boolean>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          permissions: Record<string, boolean>
        }
        Update: {
          id?: string
          name?: string
          description?: string
          permissions?: Record<string, boolean>
        }
      }
      system_users: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          first_name: string
          last_name: string
          role_id: string | null
          status: "active" | "inactive" | "suspended"
          avatar_url: string | null
          phone: string | null
          department: string | null
          last_login: string | null
          login_count: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          first_name: string
          last_name: string
          role_id?: string | null
          status?: "active" | "inactive" | "suspended"
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          last_login?: string | null
          login_count?: number
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          role_id?: string | null
          status?: "active" | "inactive" | "suspended"
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          last_login?: string | null
          login_count?: number
          updated_by?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at?: string
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Record<string, any> | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
  }
}
