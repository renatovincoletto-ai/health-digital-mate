export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          ends_at: string
          external_event_id: string | null
          external_provider: string | null
          id: string
          internal_notes: string | null
          origin: string
          patient_email: string | null
          patient_name: string
          patient_notes: string | null
          patient_phone: string | null
          professional_id: string
          service_id: string | null
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          external_event_id?: string | null
          external_provider?: string | null
          id?: string
          internal_notes?: string | null
          origin?: string
          patient_email?: string | null
          patient_name: string
          patient_notes?: string | null
          patient_phone?: string | null
          professional_id: string
          service_id?: string | null
          starts_at: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          external_event_id?: string | null
          external_provider?: string | null
          id?: string
          internal_notes?: string | null
          origin?: string
          patient_email?: string | null
          patient_name?: string
          patient_notes?: string | null
          patient_phone?: string | null
          professional_id?: string
          service_id?: string | null
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          professional_id: string
          reason: string | null
          starts_at: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          professional_id: string
          reason?: string | null
          starts_at: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string
          end_minute: number
          id: string
          professional_id: string
          start_minute: number
          tenant_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_minute: number
          id?: string
          professional_id: string
          start_minute: number
          tenant_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_minute?: number
          id?: string
          professional_id?: string
          start_minute?: number
          tenant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          accent_color: string | null
          created_at: string
          font_body: string | null
          font_heading: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string
          tone_of_voice: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id: string
          tone_of_voice?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string
          tone_of_voice?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_accounts: {
        Row: {
          account_email: string | null
          calendar_id: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          metadata: Json
          professional_id: string | null
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_email?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          professional_id?: string | null
          provider: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_email?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json
          professional_id?: string | null
          provider?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          color: string
          council_number: string | null
          council_state: string | null
          council_type: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          specialty: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          color?: string
          council_number?: string | null
          council_state?: string | null
          council_type?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          specialty?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          color?: string
          council_number?: string | null
          council_state?: string | null
          council_type?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          specialty?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          color: string
          created_at: string
          deposit_cents: number | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          price_cents: number | null
          requires_deposit: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          price_cents?: number | null
          requires_deposit?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          price_cents?: number | null
          requires_deposit?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          site_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          site_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_messages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          content: Json
          created_at: string
          id: string
          published: boolean
          seo_description: string | null
          seo_title: string | null
          tenant_id: string
          theme: Json
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          tenant_id: string
          theme?: Json
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          tenant_id?: string
          theme?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          city: string | null
          council_number: string | null
          council_state: string | null
          council_type: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          owner_id: string
          phone: string | null
          slug: string
          specialty: string | null
          state: string | null
          type: Database["public"]["Enums"]["tenant_type"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          council_number?: string | null
          council_state?: string | null
          council_type?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          owner_id: string
          phone?: string | null
          slug: string
          specialty?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          council_number?: string | null
          council_state?: string | null
          council_type?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          owner_id?: string
          phone?: string | null
          slug?: string
          specialty?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["tenant_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      user_tenant_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "owner" | "staff" | "admin"
      onboarding_status: "pending" | "site_pending" | "completed"
      tenant_type: "medico" | "dentista" | "clinica" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "staff", "admin"],
      onboarding_status: ["pending", "site_pending", "completed"],
      tenant_type: ["medico", "dentista", "clinica", "outro"],
    },
  },
} as const
