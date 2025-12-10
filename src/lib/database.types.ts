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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          category: string
          column_name: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          platform: string
          subcategory: string | null
        }
        Insert: {
          category: string
          column_name: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          platform: string
          subcategory?: string | null
        }
        Update: {
          category?: string
          column_name?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          platform?: string
          subcategory?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          month: number
          platform: string
          target: number
          type: string
          updated_at: string | null
          year: number
        }
        Insert: {
          id?: string
          month: number
          platform: string
          target: number
          type: string
          updated_at?: string | null
          year: number
        }
        Update: {
          id?: string
          month?: number
          platform?: string
          target?: number
          type?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          ip_address: string
          locked_until: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address: string
          locked_until?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string
          locked_until?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_metrics: {
        Row: {
          adjustments: number
          breakdown: Json | null
          fee_groups: Json | null
          fees: number
          last_upload_id: string | null
          per_day: Json | null
          per_day_paid: Json | null
          platform: string
          revenue: number
          revenue_groups: Json | null
          settlement: number
          total_transactions: number | null
          total_transactions_paid: number | null
          trend: number[] | null
          trend_dates: string[] | null
          updated_at: string | null
        }
        Insert: {
          adjustments?: number
          breakdown?: Json | null
          fee_groups?: Json | null
          fees?: number
          last_upload_id?: string | null
          per_day?: Json | null
          per_day_paid?: Json | null
          platform: string
          revenue?: number
          revenue_groups?: Json | null
          settlement?: number
          total_transactions?: number | null
          total_transactions_paid?: number | null
          trend?: number[] | null
          trend_dates?: string[] | null
          updated_at?: string | null
        }
        Update: {
          adjustments?: number
          breakdown?: Json | null
          fee_groups?: Json | null
          fees?: number
          last_upload_id?: string | null
          per_day?: Json | null
          per_day_paid?: Json | null
          platform?: string
          revenue?: number
          revenue_groups?: Json | null
          settlement?: number
          total_transactions?: number | null
          total_transactions_paid?: number | null
          trend?: number[] | null
          trend_dates?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_code_map: {
        Row: {
          external_code: string
          id: string
          is_active: boolean | null
          name: string
          platform: string
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          external_code: string
          id?: string
          is_active?: boolean | null
          name: string
          platform: string
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          external_code?: string
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_master: {
        Row: {
          id: string
          image_url: string | null
          is_active: boolean | null
          lazada_code: string | null
          name: string
          shopee_code: string | null
          sku: string | null
          tiktok_code: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lazada_code?: string | null
          name: string
          shopee_code?: string | null
          sku?: string | null
          tiktok_code?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lazada_code?: string | null
          name?: string
          shopee_code?: string | null
          sku?: string | null
          tiktok_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          created_at: string | null
          id: string
          order_date: string | null
          order_id: string | null
          platform: string
          product_name: string
          province_normalized: string | null
          province_raw: string | null
          qty_confirmed: number
          qty_returned: number
          raw_data: Json | null
          revenue_confirmed_thb: number
          row_no: number | null
          upload_id: string | null
          variant_code: string | null
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_date?: string | null
          order_id?: string | null
          platform?: string
          product_name: string
          province_normalized?: string | null
          province_raw?: string | null
          qty_confirmed?: number
          qty_returned?: number
          raw_data?: Json | null
          revenue_confirmed_thb?: number
          row_no?: number | null
          upload_id?: string | null
          variant_code?: string | null
          variant_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_date?: string | null
          order_id?: string | null
          platform?: string
          product_name?: string
          province_normalized?: string | null
          province_raw?: string | null
          qty_confirmed?: number
          qty_returned?: number
          raw_data?: Json | null
          revenue_confirmed_thb?: number
          row_no?: number | null
          upload_id?: string | null
          variant_code?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_product_name_fkey"
            columns: ["product_name"]
            isOneToOne: false
            referencedRelation: "product_master"
            referencedColumns: ["name"]
          },
        ]
      }
      product_sales_uploads: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          platform: string
          status: string | null
          total_products: number | null
          total_qty: number | null
          total_returned: number | null
          total_revenue: number | null
          total_rows: number | null
          total_variants: number | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id: string
          platform?: string
          status?: string | null
          total_products?: number | null
          total_qty?: number | null
          total_returned?: number | null
          total_revenue?: number | null
          total_rows?: number | null
          total_variants?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          platform?: string
          status?: string | null
          total_products?: number | null
          total_qty?: number | null
          total_returned?: number | null
          total_revenue?: number | null
          total_rows?: number | null
          total_variants?: number | null
        }
        Relationships: []
      }
      province_aliases: {
        Row: {
          alias: string
          created_at: string | null
          id: string
          standard_th: string
          updated_at: string | null
        }
        Insert: {
          alias: string
          created_at?: string | null
          id?: string
          standard_th: string
          updated_at?: string | null
        }
        Update: {
          alias?: string
          created_at?: string | null
          id?: string
          standard_th?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          adjustments: number | null
          created_at: string | null
          external_id: string
          fees: number | null
          id: number
          order_date: string | null
          payment_date: string | null
          platform: string
          raw_data: Json | null
          revenue: number | null
          settlement: number | null
          sku: string | null
          type: string | null
          updated_at: string | null
          upload_id: string
          uploaded_at: string | null
        }
        Insert: {
          adjustments?: number | null
          created_at?: string | null
          external_id: string
          fees?: number | null
          id?: number
          order_date?: string | null
          payment_date?: string | null
          platform: string
          raw_data?: Json | null
          revenue?: number | null
          settlement?: number | null
          sku?: string | null
          type?: string | null
          updated_at?: string | null
          upload_id?: string
          uploaded_at?: string | null
        }
        Update: {
          adjustments?: number | null
          created_at?: string | null
          external_id?: string
          fees?: number | null
          id?: number
          order_date?: string | null
          payment_date?: string | null
          platform?: string
          raw_data?: Json | null
          revenue?: number | null
          settlement?: number | null
          sku?: string | null
          type?: string | null
          updated_at?: string | null
          upload_id?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          adjustments: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          error_rows: number | null
          fees: number | null
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          new_rows: number | null
          platform: string
          revenue: number | null
          settlement: number | null
          skipped_rows: number | null
          status: string | null
          total_rows: number | null
          updated_rows: number | null
        }
        Insert: {
          adjustments?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          error_rows?: number | null
          fees?: number | null
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          new_rows?: number | null
          platform: string
          revenue?: number | null
          settlement?: number | null
          skipped_rows?: number | null
          status?: string | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Update: {
          adjustments?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          error_rows?: number | null
          fees?: number | null
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          new_rows?: number | null
          platform?: string
          revenue?: number | null
          settlement?: number | null
          skipped_rows?: number | null
          status?: string | null
          total_rows?: number | null
          updated_rows?: number | null
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          pin_hash: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          pin_hash: string
          role: string
          username: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          pin_hash?: string
          role?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string | null
          token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_metrics_view: {
        Row: {
          adjustments: number | null
          fees: number | null
          platform: string | null
          revenue: number | null
          settlement: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_login_attempts: { Args: never; Returns: number }
      dashboard_top_platforms: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          platform: string
          qty: number
          revenue: number
          variant: string
        }[]
      }
      dashboard_top_products: {
        Args: { p_end?: string; p_platform?: string; p_start?: string }
        Returns: {
          latest_at: string
          name: string
          platforms: string[]
          qty: number
          returned: number
          revenue: number
          variant_code: string
        }[]
      }
      dashboard_top_provinces: {
        Args: { p_end?: string; p_platform?: string; p_start?: string }
        Returns: {
          name: string
          qty: number
          revenue: number
        }[]
      }
      get_daily_metrics: {
        Args: {
          p_date_end?: string
          p_date_start?: string
          p_platform?: string
        }
        Returns: {
          adjustments: number
          fees: number
          order_date: string
          platform: string
          revenue: number
          settlement: number
          transaction_count: number
        }[]
      }
      get_dashboard_top: {
        Args: { p_end?: string; p_platform?: string; p_start?: string }
        Returns: {
          latest_at: string
          name: string
          platforms: string[]
          province: string
          qty: number
          returned: number
          revenue: number
          variant_code: string
        }[]
      }
      get_sales_by_province: {
        Args: never
        Returns: {
          product_count: number
          province: string
          total_qty: number
          total_revenue: number
        }[]
      }
      get_sales_by_province_with_products: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          product_count: number
          products: Json
          province: string
          total_qty: number
          total_revenue: number
        }[]
      }
      recalculate_platform_metrics: {
        Args: { p_platform: string }
        Returns: undefined
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
