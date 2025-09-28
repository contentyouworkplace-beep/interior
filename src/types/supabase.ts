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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          meta: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          meta?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          meta?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          project_id: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          project_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          project_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      banking_info: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          ifsc_code: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          ifsc_code?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          ifsc_code?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banking_info_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branding: {
        Row: {
          created_at: string | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          signature_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          business_address: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          business_website: string | null
          cin: string | null
          city: string | null
          country: string | null
          created_at: string | null
          default_currency: string | null
          email: string | null
          gst_rate: number | null
          gstin: string | null
          id: string
          ifsc_code: string | null
          invoice_template: string | null
          logo_url: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          primary_color: string | null
          quotation_template: string | null
          secondary_color: string | null
          signature_url: string | null
          state: string | null
          tagline: string | null
          tax_number: string | null
          terms_conditions: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          business_website?: string | null
          cin?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          email?: string | null
          gst_rate?: number | null
          gstin?: string | null
          id?: string
          ifsc_code?: string | null
          invoice_template?: string | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          primary_color?: string | null
          quotation_template?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          state?: string | null
          tagline?: string | null
          tax_number?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          business_website?: string | null
          cin?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          email?: string | null
          gst_rate?: number | null
          gstin?: string | null
          id?: string
          ifsc_code?: string | null
          invoice_template?: string | null
          logo_url?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          primary_color?: string | null
          quotation_template?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          state?: string | null
          tagline?: string | null
          tax_number?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      client_files: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          updated_at: string | null
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          filename: string
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          alt_phone: string | null
          budget_range: string | null
          city: string | null
          client_type: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferred_style: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          budget_range?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_style?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          budget_range?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_style?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          address: string | null
          cin: string | null
          city: string | null
          company_name: string
          company_tagline: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          organization_id: string
          pan: string | null
          phone: string | null
          pin_code: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          cin?: string | null
          city?: string | null
          company_name: string
          company_tagline?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          organization_id: string
          pan?: string | null
          phone?: string | null
          pin_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          cin?: string | null
          city?: string | null
          company_name?: string
          company_tagline?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          organization_id?: string
          pan?: string | null
          phone?: string | null
          pin_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_default: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          project_id: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          project_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          project_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          quantity: number
          sku: string | null
          status: string | null
          supplier: string | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          quantity?: number
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          quantity?: number
          sku?: string | null
          status?: string | null
          supplier?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string | null
          item_order: number | null
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          item_order?: number | null
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          item_order?: number | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          project_id: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          title: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          title: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted_client_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          interest_level: string | null
          last_name: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          potential_value: number | null
          source: string | null
          stage: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          interest_level?: string | null
          last_name?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          potential_value?: number | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          interest_level?: string | null
          last_name?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          potential_value?: number | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_mode: string
          project_id: string | null
          reference_number: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_mode: string
          project_id?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_mode?: string
          project_id?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          first_name: string | null
          id: string
          last_name: string | null
          permissions: Json | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_assets: {
        Row: {
          asset_type: string | null
          created_at: string | null
          file_url: string
          id: string
          label: string | null
          project_id: string
          size_bytes: number | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string | null
          file_url: string
          id?: string
          label?: string | null
          project_id: string
          size_bytes?: number | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string | null
          file_url?: string
          id?: string
          label?: string | null
          project_id?: string
          size_bytes?: number | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          description: string | null
          extension: string | null
          file_type: string | null
          folder: string | null
          id: string
          name: string
          project_id: string | null
          size_bytes: number | null
          updated_at: string | null
          uploaded_by: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          extension?: string | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name: string
          project_id?: string | null
          size_bytes?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          extension?: string | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name?: string
          project_id?: string | null
          size_bytes?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          position: number
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          position: number
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completion_percentage: number | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          name: string
          notes: string | null
          priority: string | null
          project_id: string
          role: string | null
          start_date: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          notes?: string | null
          priority?: string | null
          project_id: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          notes?: string | null
          priority?: string | null
          project_id?: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_tasks_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          created_at: string | null
          id: string
          is_manager: boolean | null
          project_id: string
          role: string | null
          team_member_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_manager?: boolean | null
          project_id: string
          role?: string | null
          team_member_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_manager?: boolean | null
          project_id?: string
          role?: string | null
          team_member_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_team_members_team_member_id"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          project_type: string
          template_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          project_type: string
          template_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          project_type?: string
          template_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          priority: string | null
          progress: number | null
          project_type: string
          special_requirements: string | null
          square_footage: number | null
          start_date: string | null
          status: string | null
          style_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          priority?: string | null
          progress?: number | null
          project_type?: string
          special_requirements?: string | null
          square_footage?: number | null
          start_date?: string | null
          status?: string | null
          style_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          priority?: string | null
          progress?: number | null
          project_type?: string
          special_requirements?: string | null
          square_footage?: number | null
          start_date?: string | null
          status?: string | null
          style_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string | null
          description: string
          discount_rate: number | null
          id: string
          item_order: number
          quantity: number
          quotation_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_rate?: number | null
          id?: string
          item_order: number
          quantity?: number
          quotation_id?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_rate?: number | null
          id?: string
          item_order?: number
          quantity?: number
          quotation_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          id: string
          issue_date: string
          items: Json | null
          notes: string | null
          project_id: string | null
          quotation_number: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          title: string
          total_amount: number
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string
          issue_date: string
          items?: Json | null
          notes?: string | null
          project_id?: string | null
          quotation_number: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string
          issue_date?: string
          items?: Json | null
          notes?: string | null
          project_id?: string | null
          quotation_number?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_logs: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          hours_logged: number | null
          id: string
          start_time: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          client_id: string | null
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          scheduled_date: string
          scheduled_time: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date: string
          scheduled_time?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          address: string | null
          advance_salary: number | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          experience_years: number | null
          hourly_rate: number | null
          id: string
          join_date: string | null
          name: string
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          role: string
          salary: number | null
          specialization: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          advance_salary?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          join_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          role: string
          salary?: number | null
          specialization?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          advance_salary?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          join_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          role?: string
          salary?: number | null
          specialization?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_projects: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_projects_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_quotations: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string
          id: string
          project_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url: string
          id?: string
          project_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string
          id?: string
          project_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_quotations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          category: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          pan: string | null
          phone: string | null
          rating: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          title: string
          category: string
          description: string | null
          client_id: string | null
          client_name: string | null
          project_date: string | null
          location: string | null
          status: 'draft' | 'published' | 'archived'
          featured: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          title: string
          category: string
          description?: string | null
          client_id?: string | null
          client_name?: string | null
          project_date?: string | null
          location?: string | null
          status?: 'draft' | 'published' | 'archived'
          featured?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          title?: string
          category?: string
          description?: string | null
          client_id?: string | null
          client_name?: string | null
          project_date?: string | null
          location?: string | null
          status?: 'draft' | 'published' | 'archived'
          featured?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_media: {
        Row: {
          id: string
          project_id: string
          filename: string
          original_filename: string
          file_type: 'image' | 'video'
          mime_type: string
          file_size: number
          file_url: string
          thumbnail_url: string | null
          storage_bucket: string
          storage_path: string
          display_order: number
          video_status: 'uploading' | 'processing' | 'ready' | 'error' | null
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          filename: string
          original_filename: string
          file_type: 'image' | 'video'
          mime_type: string
          file_size: number
          file_url: string
          thumbnail_url?: string | null
          storage_bucket?: string
          storage_path: string
          display_order?: number
          video_status?: 'uploading' | 'processing' | 'ready' | 'error' | null
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          filename?: string
          original_filename?: string
          file_type?: 'image' | 'video'
          mime_type?: string
          file_size?: number
          file_url?: string
          thumbnail_url?: string | null
          storage_bucket?: string
          storage_path?: string
          display_order?: number
          video_status?: 'uploading' | 'processing' | 'ready' | 'error' | null
          user_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      portfolio_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          icon: string | null
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          user_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      portfolio_shares: {
        Row: {
          id: string
          project_id: string
          share_token: string
          share_type: 'public' | 'password' | 'expires'
          password_hash: string | null
          expires_at: string | null
          allow_download: boolean
          allow_comments: boolean
          watermark_enabled: boolean
          view_count: number
          created_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          share_token: string
          share_type: 'public' | 'password' | 'expires'
          password_hash?: string | null
          expires_at?: string | null
          allow_download?: boolean
          allow_comments?: boolean
          watermark_enabled?: boolean
          view_count?: number
          created_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          share_token?: string
          share_type?: 'public' | 'password' | 'expires'
          password_hash?: string | null
          expires_at?: string | null
          allow_download?: boolean
          allow_comments?: boolean
          watermark_enabled?: boolean
          view_count?: number
          created_by?: string
          created_at?: string | null
        }
        Relationships: []
      }
      video_processing_jobs: {
        Row: {
          id: string
          media_id: string
          job_type: string
          status: string
          progress: number
          input_path: string
          output_path: string | null
          hls_playlist_url: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          media_id: string
          job_type: string
          status: string
          progress?: number
          input_path: string
          output_path?: string | null
          hls_playlist_url?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          media_id?: string
          job_type?: string
          status?: string
          progress?: number
          input_path?: string
          output_path?: string | null
          hls_playlist_url?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_member: {
        Args: { org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
