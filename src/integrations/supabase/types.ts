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
      accountant_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          shared_with_accountant: boolean | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          shared_with_accountant?: boolean | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          shared_with_accountant?: boolean | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          audience: string | null
          created_at: string
          daily_budget_cents: number
          description: string | null
          ended_at: string | null
          external_campaign_id: string | null
          headline: string | null
          id: string
          image_url: string | null
          landing_url: string | null
          metrics: Json
          name: string
          objective: string
          platform: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          created_at?: string
          daily_budget_cents?: number
          description?: string | null
          ended_at?: string | null
          external_campaign_id?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          landing_url?: string | null
          metrics?: Json
          name: string
          objective: string
          platform: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          created_at?: string
          daily_budget_cents?: number
          description?: string | null
          ended_at?: string | null
          external_campaign_id?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          landing_url?: string | null
          metrics?: Json
          name?: string
          objective?: string
          platform?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_responses: {
        Row: {
          ai_summary: string | null
          answers: Json
          appointment_id: string | null
          created_at: string
          id: string
          lgpd_consent: boolean
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          template_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          answers?: Json
          appointment_id?: string | null
          created_at?: string
          id?: string
          lgpd_consent?: boolean
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          template_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          answers?: Json
          appointment_id?: string | null
          created_at?: string
          id?: string
          lgpd_consent?: boolean
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          template_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_responses_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnese_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          questions: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          questions?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          questions?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bi_snapshots: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          metric_key: string
          metric_value: number
          snapshot_date: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          metric_key: string
          metric_value?: number
          snapshot_date?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          metric_key?: string
          metric_value?: number
          snapshot_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_snapshots_tenant_id_fkey"
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
      call_logs: {
        Row: {
          agent_id: string | null
          created_at: string
          direction: string
          duration_seconds: number | null
          from_number: string | null
          id: string
          notes: string | null
          outcome: string | null
          patient_id: string | null
          recording_url: string | null
          started_at: string | null
          tenant_id: string
          to_number: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          direction: string
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id?: string | null
          recording_url?: string | null
          started_at?: string | null
          tenant_id: string
          to_number?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id?: string | null
          recording_url?: string | null
          started_at?: string | null
          tenant_id?: string
          to_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          appointment_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          patient_name: string
          patient_phone: string | null
          patient_summary: string | null
          professional_id: string | null
          soap_assessment: string | null
          soap_objective: string | null
          soap_plan: string | null
          soap_subjective: string | null
          status: string
          tenant_id: string
          transcript: string | null
          updated_at: string
          whatsapp_sent_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          patient_name: string
          patient_phone?: string | null
          patient_summary?: string | null
          professional_id?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          status?: string
          tenant_id: string
          transcript?: string | null
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          patient_name?: string
          patient_phone?: string | null
          patient_summary?: string | null
          professional_id?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          status?: string
          tenant_id?: string
          transcript?: string | null
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          tenant_id: string
          title: string
          used: boolean
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          tenant_id: string
          title: string
          used?: boolean
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          tenant_id?: string
          title?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience: string
          body_html: string | null
          body_text: string | null
          clicks_count: number
          created_at: string
          id: string
          name: string
          opens_count: number
          preheader: string | null
          recipients_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body_html?: string | null
          body_text?: string | null
          clicks_count?: number
          created_at?: string
          id?: string
          name: string
          opens_count?: number
          preheader?: string | null
          recipients_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body_html?: string | null
          body_text?: string | null
          clicks_count?: number
          created_at?: string
          id?: string
          name?: string
          opens_count?: number
          preheader?: string | null
          recipients_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          subscribed: boolean
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed?: boolean
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed?: boolean
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_type: string
          balance: number | null
          bank_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_type?: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          appointment_id: string | null
          category: string | null
          created_at: string
          description: string
          direction: string
          due_date: string | null
          id: string
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          professional_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string
          description: string
          direction: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          professional_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          appointment_id?: string | null
          category?: string | null
          created_at?: string
          description?: string
          direction?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          professional_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_plans: {
        Row: {
          active: boolean | null
          ans_code: string | null
          contract_number: string | null
          created_at: string
          id: string
          operator_name: string
          plan_name: string
          rate_table: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          ans_code?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          operator_name: string
          plan_name: string
          rate_table?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          ans_code?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          operator_name?: string
          plan_name?: string
          rate_table?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
      internal_messages: {
        Row: {
          channel: string | null
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          tenant_id: string
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          tenant_id: string
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          location_id: string | null
          min_quantity: number | null
          name: string
          quantity: number | null
          sku: string | null
          tenant_id: string
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          location_id?: string | null
          min_quantity?: number | null
          name: string
          quantity?: number | null
          sku?: string | null
          tenant_id: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          location_id?: string | null
          min_quantity?: number | null
          name?: string
          quantity?: number | null
          sku?: string | null
          tenant_id?: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          movement_type: string
          quantity: number
          reason: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          movement_type: string
          quantity: number
          reason?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          journey_id: string
          next_run_at: string | null
          patient_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          journey_id: string
          next_run_at?: string | null
          patient_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          journey_id?: string
          next_run_at?: string | null
          patient_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          action: string | null
          channel: string
          created_at: string
          delay_hours: number
          id: string
          journey_id: string
          step_order: number
          template: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action?: string | null
          channel: string
          created_at?: string
          delay_hours?: number
          id?: string
          journey_id: string
          step_order?: number
          template: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action?: string | null
          channel?: string
          created_at?: string
          delay_hours?: number
          id?: string
          journey_id?: string
          step_order?: number
          template?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "patient_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          created_at: string
          google_place_id: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          iss_amount: number | null
          iss_rate: number | null
          issued_at: string | null
          metadata: Json | null
          number: string | null
          patient_id: string | null
          pdf_url: string | null
          rps_number: string | null
          service_code: string | null
          status: string
          taker_document: string | null
          taker_email: string | null
          taker_name: string | null
          tenant_id: string
          updated_at: string
          xml_url: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          iss_amount?: number | null
          iss_rate?: number | null
          issued_at?: string | null
          metadata?: Json | null
          number?: string | null
          patient_id?: string | null
          pdf_url?: string | null
          rps_number?: string | null
          service_code?: string | null
          status?: string
          taker_document?: string | null
          taker_email?: string | null
          taker_name?: string | null
          tenant_id: string
          updated_at?: string
          xml_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          iss_amount?: number | null
          iss_rate?: number | null
          issued_at?: string | null
          metadata?: Json | null
          number?: string | null
          patient_id?: string | null
          pdf_url?: string | null
          rps_number?: string | null
          service_code?: string | null
          status?: string
          taker_document?: string | null
          taker_email?: string | null
          taker_name?: string | null
          tenant_id?: string
          updated_at?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfse_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_surveys: {
        Row: {
          appointment_id: string | null
          category: string | null
          comment: string | null
          created_at: string
          id: string
          patient_id: string | null
          responded_at: string | null
          score: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          category?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          responded_at?: string | null
          score?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          category?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          responded_at?: string | null
          score?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_surveys_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_surveys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_entries: {
        Row: {
          condition: string
          created_at: string
          face: string | null
          id: string
          notes: string | null
          patient_id: string
          procedure: string | null
          recorded_by: string | null
          tenant_id: string
          tooth: string
          updated_at: string
        }
        Insert: {
          condition: string
          created_at?: string
          face?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure?: string | null
          recorded_by?: string | null
          tenant_id: string
          tooth: string
          updated_at?: string
        }
        Update: {
          condition?: string
          created_at?: string
          face?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure?: string | null
          recorded_by?: string | null
          tenant_id?: string
          tooth?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_journeys: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_journeys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: Json | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          lifetime_value: number | null
          notes: string | null
          phone: string | null
          portal_user_id: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          lifetime_value?: number | null
          notes?: string | null
          phone?: string | null
          portal_user_id?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          lifetime_value?: number | null
          notes?: string | null
          phone?: string | null
          portal_user_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          patient_id: string | null
          provider: string
          qr_code: string | null
          status: string
          tenant_id: string
          transaction_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          patient_id?: string | null
          provider?: string
          qr_code?: string | null
          status?: string
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          patient_id?: string | null
          provider?: string
          qr_code?: string | null
          status?: string
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          acquirer: string
          active: boolean | null
          created_at: string
          id: string
          label: string | null
          location_id: string | null
          model: string | null
          serial_number: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          acquirer: string
          active?: boolean | null
          created_at?: string
          id?: string
          label?: string | null
          location_id?: string | null
          model?: string | null
          serial_number?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          acquirer?: string
          active?: boolean | null
          created_at?: string
          id?: string
          label?: string | null
          location_id?: string | null
          model?: string | null
          serial_number?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_terminals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          content: string
          created_at: string
          doc_type: string
          id: string
          patient_id: string
          pdf_url: string | null
          professional_id: string | null
          qr_code: string | null
          signature_id: string | null
          signature_provider: string | null
          status: string
          tenant_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          appointment_id?: string | null
          content: string
          created_at?: string
          doc_type?: string
          id?: string
          patient_id: string
          pdf_url?: string | null
          professional_id?: string | null
          qr_code?: string | null
          signature_id?: string | null
          signature_provider?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          appointment_id?: string | null
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          patient_id?: string
          pdf_url?: string | null
          professional_id?: string | null
          qr_code?: string | null
          signature_id?: string | null
          signature_provider?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_payouts: {
        Row: {
          created_at: string
          fees_amount: number
          gross_amount: number
          id: string
          net_amount: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          professional_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fees_amount?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          professional_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fees_amount?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          professional_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_splits: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          professional_id: string
          rule_type: string
          rule_value: number
          service_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          professional_id: string
          rule_type?: string
          rule_value?: number
          service_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          professional_id?: string
          rule_type?: string
          rule_value?: number
          service_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_splits_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_splits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_splits_tenant_id_fkey"
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
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          items: Json
          patient_id: string | null
          pdf_url: string | null
          signature: string | null
          status: string
          tenant_id: string
          title: string
          total_value: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          patient_id?: string | null
          pdf_url?: string | null
          signature?: string | null
          status?: string
          tenant_id: string
          title: string
          total_value?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          patient_id?: string | null
          pdf_url?: string | null
          signature?: string | null
          status?: string
          tenant_id?: string
          title?: string
          total_value?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string | null
          created_at: string
          id: string
          redeemed_at: string | null
          referred_email: string | null
          referred_patient_id: string | null
          referrer_email: string | null
          referrer_patient_id: string | null
          reward_type: string | null
          reward_value: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          redeemed_at?: string | null
          referred_email?: string | null
          referred_patient_id?: string | null
          referrer_email?: string | null
          referrer_patient_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          redeemed_at?: string | null
          referred_email?: string | null
          referred_patient_id?: string | null
          referrer_email?: string | null
          referrer_patient_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_patient_id_fkey"
            columns: ["referred_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_patient_id_fkey"
            columns: ["referrer_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          appointment_id: string | null
          channel: string
          confirmation: string | null
          created_at: string
          id: string
          message: string
          patient_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          confirmation?: string | null
          created_at?: string
          id?: string
          message: string
          patient_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          confirmation?: string | null
          created_at?: string
          id?: string
          message?: string
          patient_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          appointment_id: string | null
          channel: string
          clicked_at: string | null
          created_at: string
          id: string
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string
          external_id: string | null
          id: string
          rating: number
          reply: string | null
          reply_status: string
          reviewed_at: string | null
          source: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          rating: number
          reply?: string | null
          reply_status?: string
          reviewed_at?: string | null
          source?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          rating?: number
          reply?: string | null
          reply_status?: string
          reviewed_at?: string | null
          source?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      social_posts: {
        Row: {
          caption: string
          created_at: string
          created_by: string | null
          hashtags: string | null
          id: string
          image_url: string | null
          metadata: Json
          platforms: string[]
          published_at: string | null
          scheduled_for: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          platforms?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          created_by?: string | null
          hashtags?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          platforms?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_obligations: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          kind: string
          notes: string | null
          paid_at: string | null
          period: string
          receipt_url: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          kind: string
          notes?: string | null
          paid_at?: string | null
          period: string
          receipt_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          kind?: string
          notes?: string | null
          paid_at?: string | null
          period?: string
          receipt_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_obligations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tef_transactions: {
        Row: {
          amount: number
          authorization_code: string | null
          brand: string | null
          captured_at: string | null
          created_at: string
          id: string
          installments: number | null
          net_amount: number | null
          nsu: string | null
          patient_id: string | null
          status: string
          tenant_id: string
          terminal_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          authorization_code?: string | null
          brand?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          net_amount?: number | null
          nsu?: string | null
          patient_id?: string | null
          status?: string
          tenant_id: string
          terminal_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          brand?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          net_amount?: number | null
          nsu?: string | null
          patient_id?: string | null
          status?: string
          tenant_id?: string
          terminal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tef_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tef_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tef_transactions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_sessions: {
        Row: {
          appointment_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          patient_id: string | null
          professional_id: string | null
          recording_url: string | null
          room_token: string | null
          room_url: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          patient_id?: string | null
          professional_id?: string | null
          recording_url?: string | null
          room_token?: string | null
          room_url: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          patient_id?: string | null
          professional_id?: string | null
          recording_url?: string | null
          room_token?: string | null
          room_url?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
      tiss_guides: {
        Row: {
          amount: number
          authorization_number: string | null
          created_at: string
          glosa_amount: number | null
          guide_number: string | null
          guide_type: string
          id: string
          insurance_plan_id: string | null
          notes: string | null
          paid_amount: number | null
          patient_id: string | null
          service_date: string | null
          status: string
          submitted_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          authorization_number?: string | null
          created_at?: string
          glosa_amount?: number | null
          guide_number?: string | null
          guide_type: string
          id?: string
          insurance_plan_id?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          service_date?: string | null
          status?: string
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          authorization_number?: string | null
          created_at?: string
          glosa_amount?: number | null
          guide_number?: string | null
          guide_type?: string
          id?: string
          insurance_plan_id?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          service_date?: string | null
          status?: string
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiss_guides_insurance_plan_id_fkey"
            columns: ["insurance_plan_id"]
            isOneToOne: false
            referencedRelation: "insurance_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items: {
        Row: {
          created_at: string
          face: string | null
          id: string
          plan_id: string
          procedure_name: string
          quantity: number | null
          sequence: number | null
          status: string
          tenant_id: string
          tooth: string | null
          unit_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          face?: string | null
          id?: string
          plan_id: string
          procedure_name: string
          quantity?: number | null
          sequence?: number | null
          status?: string
          tenant_id: string
          tooth?: string | null
          unit_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          face?: string | null
          id?: string
          plan_id?: string
          procedure_name?: string
          quantity?: number | null
          sequence?: number | null
          status?: string
          tenant_id?: string
          tooth?: string | null
          unit_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          accepted_at: string | null
          created_at: string
          description: string | null
          id: string
          patient_id: string
          professional_id: string | null
          status: string
          tenant_id: string
          title: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id: string
          professional_id?: string | null
          status?: string
          tenant_id: string
          title: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id?: string
          professional_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
