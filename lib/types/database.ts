// DEPRECATED FILE
// -----------------------------------------------------------------------------
// This file is retained temporarily for historical reference only.
// All consumers should import types from `@/types/supabase` which is generated
// (and extended) as the single source of truth.
// Do NOT add new types here. This file will be removed once all stray imports
// are eliminated.
// -----------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          company: string | null
          client_type: string
          email: string
          phone: string
          alt_phone: string | null
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          company?: string | null
          client_type: string
          email: string
          phone: string
          alt_phone?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          company?: string | null
          client_type?: string
          email?: string
          phone?: string
          alt_phone?: string | null
        }
      },
      team_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          role: string;
          specialization: string | null;
          hourly_rate: number | null;
          experience_years: number | null;
          bio: string | null;
          salary: number | null;
          advance_salary: number | null;
          status: string;
          join_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          role: string;
          specialization?: string | null;
          hourly_rate?: number | null;
          experience_years?: number | null;
          bio?: string | null;
          salary?: number | null;
          advance_salary?: number | null;
          status?: string;
          join_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: string;
          specialization?: string | null;
          hourly_rate?: number | null;
          experience_years?: number | null;
          portfolio_url?: string | null;
          bio?: string | null;
          salary?: number | null;
          advance_salary?: number | null;
          status?: string;
          join_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      },
      payments: {
        Row: {
          id: string
          user_id: string
          client_id: string
          project_id: string | null
          invoice_id: string | null
          amount: number
          payment_date: string
          payment_mode: string
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          project_id?: string | null
          invoice_id?: string | null
          amount: number
          payment_date: string
          payment_mode: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          project_id?: string | null
          invoice_id?: string | null
          amount?: number
          payment_date?: string
          payment_mode?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
  expenses: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          category: string
          amount: number
          description: string
          expense_date: string
          receipt_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          category: string
          amount: number
          description: string
          expense_date: string
          receipt_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          category?: string
          amount?: number
          description?: string
          expense_date?: string
          receipt_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          name: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          gstin: string | null
          pan: string | null
          category: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_projects: {
        Row: {
          id: string
          vendor_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          project_id?: string
          created_at?: string
        }
      }
      vendor_quotations: {
        Row: {
          id: string
          vendor_id: string
          project_id: string | null
          file_url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          project_id?: string | null
          file_url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          project_id?: string | null
          file_url?: string
          description?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string
          name: string
          description: string | null
          project_type: string
          status: string
          priority: string
          budget: number | null
          start_date: string | null
          end_date: string | null
          completion_percentage: number
          location: string | null
          style_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          name: string
          description?: string | null
          project_type: string
          status?: string
          priority?: string
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_percentage?: number
          location?: string | null
          style_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          name?: string
          description?: string | null
          project_type?: string
          status?: string
          priority?: string
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_percentage?: number
          location?: string | null
          style_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        },
        project_team_members: {
          Row: {
            id: string
            user_id: string
            project_id: string
            team_member_id: string
            role: string | null
            is_manager: boolean | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            project_id: string
            team_member_id: string
            role?: string | null
            is_manager?: boolean | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            project_id?: string
            team_member_id?: string
            role?: string | null
            is_manager?: boolean | null
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        },
        project_phases: {
          Row: {
            id: string
            user_id: string
            project_id: string
            name: string
            description: string | null
            position: number
            status: string | null
            start_date: string | null
            end_date: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            project_id: string
            name: string
            description?: string | null
            position?: number
            status?: string | null
            start_date?: string | null
            end_date?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            project_id?: string
            name?: string
            description?: string | null
            position?: number
            status?: string | null
            start_date?: string | null
            end_date?: string | null
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        }
      }
    }
  }