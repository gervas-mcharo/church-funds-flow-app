export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      approval_chain: {
        Row: {
          approval_date: string | null
          approver_id: string | null
          approver_role: Database["public"]["Enums"]["app_role"]
          comments: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          money_request_id: string
          step_order: number
        }
        Insert: {
          approval_date?: string | null
          approver_id?: string | null
          approver_role: Database["public"]["Enums"]["app_role"]
          comments?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          money_request_id: string
          step_order: number
        }
        Update: {
          approval_date?: string | null
          approver_id?: string | null
          approver_role?: Database["public"]["Enums"]["app_role"]
          comments?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          money_request_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_chain_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_chain_money_request_id_fkey"
            columns: ["money_request_id"]
            isOneToOne: false
            referencedRelation: "money_requests"
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          currency_name: string
          currency_symbol: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          currency_name?: string
          currency_symbol?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
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
      money_requests: {
        Row: {
          amount: number
          associated_project: string | null
          created_at: string
          fund_budget_code: string | null
          id: string
          purpose: string
          request_date: string
          requester_id: string
          requesting_department_id: string
          status: Database["public"]["Enums"]["money_request_status"]
          suggested_vendor: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          associated_project?: string | null
          created_at?: string
          fund_budget_code?: string | null
          id?: string
          purpose: string
          request_date?: string
          requester_id: string
          requesting_department_id: string
          status?: Database["public"]["Enums"]["money_request_status"]
          suggested_vendor?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          associated_project?: string | null
          created_at?: string
          fund_budget_code?: string | null
          id?: string
          purpose?: string
          request_date?: string
          requester_id?: string
          requesting_department_id?: string
          status?: Database["public"]["Enums"]["money_request_status"]
          suggested_vendor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      request_attachments: {
        Row: {
          content_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          money_request_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          content_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          money_request_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          content_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          money_request_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_attachments_money_request_id_fkey"
            columns: ["money_request_id"]
            isOneToOne: false
            referencedRelation: "money_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      create_approval_chain: {
        Args: { request_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "administrator"
        | "data_entry_clerk"
        | "finance_manager"
        | "head_of_department"
        | "secretary"
        | "treasurer"
        | "department_member"
        | "super_administrator"
        | "finance_administrator"
        | "pastor"
        | "general_secretary"
        | "finance_elder"
        | "contributor"
      money_request_status:
        | "submitted"
        | "pending_hod_approval"
        | "pending_finance_elder_approval"
        | "pending_general_secretary_approval"
        | "pending_pastor_approval"
        | "approved"
        | "rejected"
        | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrator",
        "data_entry_clerk",
        "finance_manager",
        "head_of_department",
        "secretary",
        "treasurer",
        "department_member",
        "super_administrator",
        "finance_administrator",
        "pastor",
        "general_secretary",
        "finance_elder",
        "contributor",
      ],
      money_request_status: [
        "submitted",
        "pending_hod_approval",
        "pending_finance_elder_approval",
        "pending_general_secretary_approval",
        "pending_pastor_approval",
        "approved",
        "rejected",
        "paid",
      ],
    },
  },
} as const
