export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrganizationStatus = 'active' | 'inactive' | 'suspended'
export type MemberRole = 'owner' | 'admin' | 'viewer'
export type ButtonType = 'cta' | 'detail' | 'transition'
export type ConversionType = 'click' | 'video_view'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          status: OrganizationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: OrganizationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: OrganizationStatus
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: MemberRole
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          role?: MemberRole
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: MemberRole
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          allowed_origins: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          project_id: string
          title: string
          storage_path: string
          thumbnail_path: string | null
          duration_ms: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          storage_path: string
          thumbnail_path?: string | null
          duration_ms: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          storage_path?: string
          thumbnail_path?: string | null
          duration_ms?: number
          created_at?: string
          updated_at?: string
        }
      }
      slots: {
        Row: {
          id: string
          project_id: string
          video_id: string
          name: string
          is_entry_point: boolean
          button_type: ButtonType
          button_label: string
          button_url: string | null
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          video_id: string
          name: string
          is_entry_point?: boolean
          button_type?: ButtonType
          button_label?: string
          button_url?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          video_id?: string
          name?: string
          is_entry_point?: boolean
          button_type?: ButtonType
          button_label?: string
          button_url?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
      }
      slot_transitions: {
        Row: {
          id: string
          from_slot_id: string
          to_slot_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_slot_id: string
          to_slot_id: string
          created_at?: string
        }
        Update: {
          id?: string
          from_slot_id?: string
          to_slot_id?: string
          created_at?: string
        }
      }
      conversion_rules: {
        Row: {
          id: string
          project_id: string
          name: string
          conversion_type: ConversionType
          target_slot_id: string | null
          target_url_pattern: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          conversion_type: ConversionType
          target_slot_id?: string | null
          target_url_pattern?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          conversion_type?: ConversionType
          target_slot_id?: string | null
          target_url_pattern?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          project_id: string
          visitor_id: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          project_id: string
          visitor_id: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          visitor_id?: string
          created_at?: string
          expires_at?: string
        }
      }
      event_widget_opens: {
        Row: {
          id: string
          session_id: string
          page_url: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          page_url: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          page_url?: string
          created_at?: string
        }
      }
      event_video_starts: {
        Row: {
          id: string
          session_id: string
          slot_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          slot_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          slot_id?: string
          created_at?: string
        }
      }
      event_video_views: {
        Row: {
          id: string
          session_id: string
          slot_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          slot_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          slot_id?: string
          created_at?: string
        }
      }
      event_clicks: {
        Row: {
          id: string
          session_id: string
          slot_id: string
          button_type: ButtonType
          destination_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          slot_id: string
          button_type: ButtonType
          destination_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          slot_id?: string
          button_type?: ButtonType
          destination_url?: string | null
          created_at?: string
        }
      }
      event_conversions: {
        Row: {
          id: string
          session_id: string
          conversion_rule_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          conversion_rule_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          conversion_rule_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      is_my_organization_project: {
        Args: { _project_id: string }
        Returns: boolean
      }
    }
    Enums: {
      organization_status: OrganizationStatus
      member_role: MemberRole
      button_type: ButtonType
      conversion_type: ConversionType
    }
  }
}

// Helper type for table names
type PublicTableNames = keyof Database['public']['Tables']

// Table row types helper - get the Row type for a table
export type Tables<T extends PublicTableNames> =
  Database['public']['Tables'][T]['Row']

// Table insert types helper - get the Insert type for a table
export type Inserts<T extends PublicTableNames> =
  Database['public']['Tables'][T]['Insert']

// Table update types helper - get the Update type for a table
export type Updates<T extends PublicTableNames> =
  Database['public']['Tables'][T]['Update']

// Re-export for convenience
export type { PublicTableNames }
