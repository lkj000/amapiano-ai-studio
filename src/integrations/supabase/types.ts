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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      automation_lanes: {
        Row: {
          automation_points: Json
          created_at: string
          effect_id: string | null
          id: string
          is_enabled: boolean | null
          parameter_name: string
          parameter_type: string
          project_id: string | null
          track_id: string
          updated_at: string
        }
        Insert: {
          automation_points?: Json
          created_at?: string
          effect_id?: string | null
          id?: string
          is_enabled?: boolean | null
          parameter_name: string
          parameter_type?: string
          project_id?: string | null
          track_id: string
          updated_at?: string
        }
        Update: {
          automation_points?: Json
          created_at?: string
          effect_id?: string | null
          id?: string
          is_enabled?: boolean | null
          parameter_name?: string
          parameter_type?: string
          project_id?: string | null
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_lanes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_participants: {
        Row: {
          current_tool: string | null
          cursor_position: Json | null
          id: string
          is_active: boolean | null
          joined_at: string
          last_seen: string
          permissions: Json | null
          session_id: string | null
          user_color: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          current_tool?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen?: string
          permissions?: Json | null
          session_id?: string | null
          user_color?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          current_tool?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_seen?: string
          permissions?: Json | null
          session_id?: string | null
          user_color?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaboration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          host_user_id: string | null
          id: string
          is_active: boolean | null
          participant_limit: number | null
          project_id: string | null
          session_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          participant_limit?: number | null
          project_id?: string | null
          session_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          host_user_id?: string | null
          id?: string
          is_active?: boolean | null
          participant_limit?: number | null
          project_id?: string | null
          session_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daw_projects: {
        Row: {
          bpm: number
          created_at: string
          id: string
          key_signature: string | null
          name: string
          project_data: Json
          time_signature: string | null
          updated_at: string
          user_id: string | null
          version: number
        }
        Insert: {
          bpm?: number
          created_at?: string
          id?: string
          key_signature?: string | null
          name: string
          project_data: Json
          time_signature?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Update: {
          bpm?: number
          created_at?: string
          id?: string
          key_signature?: string | null
          name?: string
          project_data?: Json
          time_signature?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          currency: string | null
          description: string | null
          download_url: string | null
          downloads: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          preview_url: string | null
          price_cents: number
          rating: number | null
          seller_id: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          download_url?: string | null
          downloads?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          preview_url?: string | null
          price_cents: number
          rating?: number | null
          seller_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          download_url?: string | null
          downloads?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          preview_url?: string | null
          price_cents?: number
          rating?: number | null
          seller_id?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          product_id: string | null
          product_type: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          product_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          product_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_seller: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_seller?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_seller?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_changes: {
        Row: {
          change_data: Json
          change_type: string
          id: string
          project_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          change_data: Json
          change_type: string
          id?: string
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          change_data?: Json
          change_type?: string
          id?: string
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "daw_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      samples: {
        Row: {
          bpm: number | null
          category: string
          created_at: string
          description: string | null
          duration: number
          file_size: number | null
          file_url: string
          id: string
          is_public: boolean | null
          key_signature: string | null
          name: string
          tags: string[] | null
          updated_at: string
          user_id: string | null
          waveform_data: Json | null
        }
        Insert: {
          bpm?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: number
          file_size?: number | null
          file_url: string
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          waveform_data?: Json | null
        }
        Update: {
          bpm?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: number
          file_size?: number | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          waveform_data?: Json | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          marketplace_item_id: string | null
          order_id: string | null
          purchased_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          marketplace_item_id?: string | null
          order_id?: string | null
          purchased_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          marketplace_item_id?: string | null
          order_id?: string | null
          purchased_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: "free" | "producer" | "professional" | "enterprise"
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
      subscription_tier: ["free", "producer", "professional", "enterprise"],
    },
  },
} as const
