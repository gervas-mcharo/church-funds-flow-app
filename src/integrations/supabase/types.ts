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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      approval_chain: {
        Row: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          created_at: string
          department_id: string
          id: string
          is_required: boolean
          order_sequence: number
        }
        Insert: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          created_at?: string
          department_id: string
          id?: string
          is_required?: boolean
          order_sequence: number
        }
        Update: {
          approval_level?: Database["public"]["Enums"]["approval_level"]
          created_at?: string
          department_id?: string
          id?: string
          is_required?: boolean
          order_sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_chain_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          contribution_date: string
          contributor_id: string
          created_at: string
          department_id: string | null
          fund_type_id: string
          id: string
          notes: string | null
          qr_code_id: string | null
        }
        Insert: {
          amount: number
          contribution_date?: string
          contributor_id: string
          created_at?: string
          department_id?: string | null
          fund_type_id: string
          id?: string
          notes?: string | null
          qr_code_id?: string | null
        }
        Update: {
          amount?: number
          contribution_date?: string
          contributor_id?: string
          created_at?: string
          department_id?: string | null
          fund_type_id?: string
          id?: string
          notes?: string | null
          qr_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_fund_type_id_fkey"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      contributors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_currencies: {
        Row: {
          created_at: string
          currency_code: string
          currency_name: string
          currency_symbol: string
          id: string
          organization_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          currency_name: string
          currency_symbol: string
          id?: string
          organization_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          currency_name?: string
          currency_symbol?: string
          id?: string
          organization_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      department_funds: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          department_id: string
          fund_type_id: string
          id: string
          is_active: boolean
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          department_id: string
          fund_type_id: string
          id?: string
          is_active?: boolean
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          department_id?: string
          fund_type_id?: string
          id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "department_funds_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_funds_fund_type_id_fkey"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
        ]
      }
      department_personnel: {
        Row: {
          assigned_at: string
          department_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          department_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          department_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_personnel_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_personnel_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_treasurers: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          department_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          department_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          department_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_treasurers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      fund_types: {
        Row: {
          created_at: string
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          opening_balance: number | null
        }
        Insert: {
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          opening_balance?: number | null
        }
        Update: {
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          opening_balance?: number | null
        }
        Relationships: []
      }
      money_requests: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          description: string | null
          fund_type_id: string
          id: string
          purpose: string
          rejected_at: string | null
          rejection_reason: string | null
          requester_id: string
          requesting_department_id: string
          status: Database["public"]["Enums"]["request_status"]
          suggested_vendor: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          description?: string | null
          fund_type_id: string
          id?: string
          purpose: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requester_id: string
          requesting_department_id: string
          status?: Database["public"]["Enums"]["request_status"]
          suggested_vendor?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          description?: string | null
          fund_type_id?: string
          id?: string
          purpose?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requester_id?: string
          requesting_department_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          suggested_vendor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_money_requests_department"
            columns: ["requesting_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_money_requests_fund_type"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_money_requests_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_requests_fund_type_id_fkey"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_requests_requesting_department_id_fkey"
            columns: ["requesting_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "money_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pledge_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          pledge_id: string
          reason: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          pledge_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          pledge_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pledge_audit_log_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "pledges"
            referencedColumns: ["id"]
          },
        ]
      }
      pledge_contributions: {
        Row: {
          amount_applied: number
          applied_at: string
          applied_by: string | null
          contribution_id: string
          id: string
          notes: string | null
          pledge_id: string
        }
        Insert: {
          amount_applied: number
          applied_at?: string
          applied_by?: string | null
          contribution_id: string
          id?: string
          notes?: string | null
          pledge_id: string
        }
        Update: {
          amount_applied?: number
          applied_at?: string
          applied_by?: string | null
          contribution_id?: string
          id?: string
          notes?: string | null
          pledge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledge_contributions_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledge_contributions_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "pledges"
            referencedColumns: ["id"]
          },
        ]
      }
      pledges: {
        Row: {
          contributor_id: string
          created_at: string
          created_by: string | null
          department_id: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["pledge_frequency"]
          fund_type_id: string
          id: string
          installment_amount: number | null
          last_payment_date: string | null
          next_payment_date: string | null
          notes: string | null
          number_of_installments: number | null
          pledge_amount: number
          purpose: string | null
          remaining_balance: number | null
          start_date: string
          status: Database["public"]["Enums"]["pledge_status"]
          total_paid: number
          updated_at: string
        }
        Insert: {
          contributor_id: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["pledge_frequency"]
          fund_type_id: string
          id?: string
          installment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          number_of_installments?: number | null
          pledge_amount: number
          purpose?: string | null
          remaining_balance?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["pledge_status"]
          total_paid?: number
          updated_at?: string
        }
        Update: {
          contributor_id?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["pledge_frequency"]
          fund_type_id?: string
          id?: string
          installment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          number_of_installments?: number | null
          pledge_amount?: number
          purpose?: string | null
          remaining_balance?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["pledge_status"]
          total_paid?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pledges_contributor"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pledges_fund_type"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          contributor_id: string | null
          created_at: string
          fund_type_id: string | null
          id: string
          is_active: boolean
          qr_data: string
        }
        Insert: {
          contributor_id?: string | null
          created_at?: string
          fund_type_id?: string | null
          id?: string
          is_active?: boolean
          qr_data: string
        }
        Update: {
          contributor_id?: string | null
          created_at?: string
          fund_type_id?: string | null
          id?: string
          is_active?: boolean
          qr_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_fund_type_id_fkey"
            columns: ["fund_type_id"]
            isOneToOne: false
            referencedRelation: "fund_types"
            referencedColumns: ["id"]
          },
        ]
      }
      request_approvals: {
        Row: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          approved_at: string | null
          approver_id: string | null
          comments: string | null
          created_at: string
          id: string
          order_sequence: number
          request_id: string
          status: string
        }
        Insert: {
          approval_level: Database["public"]["Enums"]["approval_level"]
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          order_sequence: number
          request_id: string
          status?: string
        }
        Update: {
          approval_level?: Database["public"]["Enums"]["approval_level"]
          approved_at?: string | null
          approver_id?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          order_sequence?: number
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_approvals_approver_profile"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "money_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          request_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "money_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_approval_chain: {
        Args: {
          approval_status: string
          p_approver_id: string
          p_comments?: string
          p_request_id: string
        }
        Returns: undefined
      }
      can_access_department: {
        Args: { dept_id: string; user_id: string }
        Returns: boolean
      }
      can_access_department_finances: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_funds: { Args: never; Returns: boolean }
      can_access_qr_management: { Args: never; Returns: boolean }
      can_any_head_approve_request: {
        Args: { request_id: string; user_id: string }
        Returns: boolean
      }
      can_approve_request: {
        Args: { request_id: string; user_id: string }
        Returns: boolean
      }
      can_bulk_import_pledges: { Args: never; Returns: boolean }
      can_create_funds: { Args: never; Returns: boolean }
      can_create_pledges: { Args: never; Returns: boolean }
      can_create_qr_codes: { Args: never; Returns: boolean }
      can_delete_pledges: { Args: never; Returns: boolean }
      can_delete_qr_codes: { Args: never; Returns: boolean }
      can_manage_funds: { Args: never; Returns: boolean }
      can_manage_pledges: { Args: never; Returns: boolean }
      create_approval_chain: {
        Args: { request_id: string }
        Returns: undefined
      }
      current_user_has_admin_role: { Args: never; Returns: boolean }
      get_user_pending_approvals: {
        Args: { user_id: string }
        Returns: {
          amount: number
          approval_level: Database["public"]["Enums"]["approval_level"]
          created_at: string
          department_name: string
          purpose: string
          request_id: string
          requester_name: string
        }[]
      }
      get_user_treasurer_departments: {
        Args: { _user_id: string }
        Returns: {
          department_id: string
          department_name: string
        }[]
      }
      has_department_role: {
        Args: {
          dept_id: string
          required_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_system_with_admin: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_department_treasurer: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_system_initialized: { Args: never; Returns: boolean }
      log_security_event: {
        Args: {
          _action: string
          _new_values?: Json
          _old_values?: Json
          _record_id?: string
          _table_name: string
        }
        Returns: undefined
      }
      update_pledge_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "administrator"
        | "finance_administrator"
        | "finance_manager"
        | "finance_elder"
        | "treasurer"
        | "department_treasurer"
        | "data_entry_clerk"
        | "general_secretary"
        | "pastor"
        | "head_of_department"
        | "department_member"
        | "secretary"
      approval_level:
        | "department_treasurer"
        | "head_of_department"
        | "finance_elder"
        | "general_secretary"
        | "pastor"
      pledge_frequency:
        | "one_time"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "annually"
      pledge_status:
        | "active"
        | "upcoming"
        | "partially_fulfilled"
        | "fulfilled"
        | "overdue"
        | "cancelled"
      request_status:
        | "draft"
        | "submitted"
        | "pending_treasurer"
        | "pending_hod"
        | "pending_finance_elder"
        | "pending_general_secretary"
        | "pending_pastor"
        | "approved"
        | "rejected"
        | "paid"
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
      app_role: [
        "administrator",
        "finance_administrator",
        "finance_manager",
        "finance_elder",
        "treasurer",
        "department_treasurer",
        "data_entry_clerk",
        "general_secretary",
        "pastor",
        "head_of_department",
        "department_member",
        "secretary",
      ],
      approval_level: [
        "department_treasurer",
        "head_of_department",
        "finance_elder",
        "general_secretary",
        "pastor",
      ],
      pledge_frequency: [
        "one_time",
        "weekly",
        "monthly",
        "quarterly",
        "annually",
      ],
      pledge_status: [
        "active",
        "upcoming",
        "partially_fulfilled",
        "fulfilled",
        "overdue",
        "cancelled",
      ],
      request_status: [
        "draft",
        "submitted",
        "pending_treasurer",
        "pending_hod",
        "pending_finance_elder",
        "pending_general_secretary",
        "pending_pastor",
        "approved",
        "rejected",
        "paid",
      ],
    },
  },
} as const
