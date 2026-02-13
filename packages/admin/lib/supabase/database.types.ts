export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      conversion_rules: {
        Row: {
          attribution_days: number
          created_at: string
          id: string
          name: string
          project_id: string
          rule_type: string
          rule_value: string
          updated_at: string
        }
        Insert: {
          attribution_days?: number
          created_at?: string
          id?: string
          name: string
          project_id: string
          rule_type?: string
          rule_value: string
          updated_at?: string
        }
        Update: {
          attribution_days?: number
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          rule_type?: string
          rule_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_clicks: {
        Row: {
          click_type: string
          created_at: string
          id: string
          next_slot_id: string | null
          session_id: string
          slot_id: string | null
          target_label: string | null
          target_url: string | null
          video_id: string | null
        }
        Insert: {
          click_type: string
          created_at?: string
          id?: string
          next_slot_id?: string | null
          session_id: string
          slot_id?: string | null
          target_label?: string | null
          target_url?: string | null
          video_id?: string | null
        }
        Update: {
          click_type?: string
          created_at?: string
          id?: string
          next_slot_id?: string | null
          session_id?: string
          slot_id?: string | null
          target_label?: string | null
          target_url?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_clicks_next_slot_id_fkey"
            columns: ["next_slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_clicks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_clicks_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_clicks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_conversions: {
        Row: {
          conversion_rule_id: string
          created_at: string
          id: string
          last_video_start_id: string | null
          matched_url: string | null
          session_id: string
        }
        Insert: {
          conversion_rule_id: string
          created_at?: string
          id?: string
          last_video_start_id?: string | null
          matched_url?: string | null
          session_id: string
        }
        Update: {
          conversion_rule_id?: string
          created_at?: string
          id?: string
          last_video_start_id?: string | null
          matched_url?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_conversions_conversion_rule_id_fkey"
            columns: ["conversion_rule_id"]
            isOneToOne: false
            referencedRelation: "conversion_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_conversions_last_video_start_id_fkey"
            columns: ["last_video_start_id"]
            isOneToOne: false
            referencedRelation: "event_video_starts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_conversions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_video_starts: {
        Row: {
          created_at: string
          id: string
          session_id: string
          slot_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          slot_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          slot_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_video_starts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_video_starts_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_video_starts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_video_views: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          played_seconds: number
          session_id: string
          slot_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          played_seconds: number
          session_id: string
          slot_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          played_seconds?: number
          session_id?: string
          slot_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_video_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_video_views_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_widget_opens: {
        Row: {
          created_at: string
          id: string
          referrer: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referrer?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referrer?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_widget_opens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["organization_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["organization_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["organization_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allowed_origins: string[] | null
          background_url: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          allowed_origins?: string[] | null
          background_url?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          allowed_origins?: string[] | null
          background_url?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_transitions: {
        Row: {
          created_at: string
          display_order: number
          from_slot_id: string
          id: string
          to_slot_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          from_slot_id: string
          id?: string
          to_slot_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          from_slot_id?: string
          id?: string
          to_slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_transitions_from_slot_id_fkey"
            columns: ["from_slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_transitions_to_slot_id_fkey"
            columns: ["to_slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          created_at: string
          cta_button_text: string | null
          cta_button_url: string | null
          detail_button_text: string | null
          detail_button_url: string | null
          id: string
          is_entry_point: boolean
          position_x: number | null
          position_y: number | null
          project_id: string
          slot_key: string
          title: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          cta_button_text?: string | null
          cta_button_url?: string | null
          detail_button_text?: string | null
          detail_button_url?: string | null
          id?: string
          is_entry_point?: boolean
          position_x?: number | null
          position_y?: number | null
          project_id: string
          slot_key: string
          title?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          cta_button_text?: string | null
          cta_button_url?: string | null
          detail_button_text?: string | null
          detail_button_url?: string | null
          id?: string
          is_entry_point?: boolean
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          slot_key?: string
          title?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          project_id: string
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          project_id: string
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: never; Returns: boolean }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["member_role"]
      }
      is_my_organization_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      is_organization_active: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      member_role: "owner" | "admin" | "viewer"
      organization_status: "active" | "inactive"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["owner", "admin", "viewer"],
      organization_status: ["active", "inactive"],
    },
  },
} as const

