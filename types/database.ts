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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          added_by: string | null
          can_edit_class_settings: boolean
          can_manage_assignments: boolean
          can_manage_grades: boolean
          can_manage_roster: boolean
          class_id: string
          class_role: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          added_by?: string | null
          can_edit_class_settings?: boolean
          can_manage_assignments?: boolean
          can_manage_grades?: boolean
          can_manage_roster?: boolean
          class_id: string
          class_role?: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          added_by?: string | null
          can_edit_class_settings?: boolean
          can_manage_assignments?: boolean
          can_manage_grades?: boolean
          can_manage_roster?: boolean
          class_id?: string
          class_role?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          period: string | null
          school_year: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          period?: string | null
          school_year?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          period?: string | null
          school_year?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          enabled: boolean
          flag_key: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          flag_key: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          flag_key?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          conversation: Json
          created_at: string
          escalated_to_teacher: boolean
          id: string
          lab_run_id: string
          resolved: boolean
          step_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          conversation?: Json
          created_at?: string
          escalated_to_teacher?: boolean
          id?: string
          lab_run_id: string
          resolved?: boolean
          step_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          conversation?: Json
          created_at?: string
          escalated_to_teacher?: boolean
          id?: string
          lab_run_id?: string
          resolved?: boolean
          step_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_lab_run_id_fkey"
            columns: ["lab_run_id"]
            isOneToOne: false
            referencedRelation: "student_lab_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "lab_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_assignments: {
        Row: {
          assigned_by: string
          class_id: string
          created_at: string
          due_date: string | null
          id: string
          instructions_override: string | null
          lab_id: string
        }
        Insert: {
          assigned_by: string
          class_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions_override?: string | null
          lab_id: string
        }
        Update: {
          assigned_by?: string
          class_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          instructions_override?: string | null
          lab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_assignments_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_steps: {
        Row: {
          checkpoint: string | null
          created_at: string
          data_entry_fields: Json | null
          id: string
          image_url: string | null
          instructions: string
          lab_id: string
          reflection_prompt: string | null
          step_number: number
          title: string
          troubleshooting: string | null
        }
        Insert: {
          checkpoint?: string | null
          created_at?: string
          data_entry_fields?: Json | null
          id?: string
          image_url?: string | null
          instructions: string
          lab_id: string
          reflection_prompt?: string | null
          step_number: number
          title: string
          troubleshooting?: string | null
        }
        Update: {
          checkpoint?: string | null
          created_at?: string
          data_entry_fields?: Json | null
          id?: string
          image_url?: string | null
          instructions?: string
          lab_id?: string
          reflection_prompt?: string | null
          step_number?: number
          title?: string
          troubleshooting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_steps_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          ai_generated: boolean
          background: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          materials_list: string[]
          objectives: string[]
          organization_id: string
          overview: string | null
          safety_notes: string | null
          standards: string[]
          status: Database["public"]["Enums"]["lab_status"]
          teacher_id: string
          teacher_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          background?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          materials_list?: string[]
          objectives?: string[]
          organization_id: string
          overview?: string | null
          safety_notes?: string | null
          standards?: string[]
          status?: Database["public"]["Enums"]["lab_status"]
          teacher_id: string
          teacher_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          background?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          materials_list?: string[]
          objectives?: string[]
          organization_id?: string
          overview?: string | null
          safety_notes?: string | null
          standards?: string[]
          status?: Database["public"]["Enums"]["lab_status"]
          teacher_id?: string
          teacher_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          data_retention_months: number
          footer_text: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          staff_code: string | null
          student_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_retention_months?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          slug: string
          staff_code?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_retention_months?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          staff_code?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pre_lab_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          lab_id: string
          options: Json | null
          position: number
          question_text: string
          question_type: string
          required: boolean
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          lab_id: string
          options?: Json | null
          position?: number
          question_text: string
          question_type?: string
          required?: boolean
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          lab_id?: string
          options?: Json | null
          position?: number
          question_text?: string
          question_type?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pre_lab_questions_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_lab_responses: {
        Row: {
          id: string
          is_valid: boolean | null
          lab_run_id: string
          question_id: string
          response_text: string | null
          saved_at: string
          student_id: string
        }
        Insert: {
          id?: string
          is_valid?: boolean | null
          lab_run_id: string
          question_id: string
          response_text?: string | null
          saved_at?: string
          student_id: string
        }
        Update: {
          id?: string
          is_valid?: boolean | null
          lab_run_id?: string
          question_id?: string
          response_text?: string | null
          saved_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_lab_responses_lab_run_id_fkey"
            columns: ["lab_run_id"]
            isOneToOne: false
            referencedRelation: "student_lab_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_lab_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "pre_lab_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_lab_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coppa_consented: boolean
          created_at: string
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          coppa_consented?: boolean
          created_at?: string
          first_name?: string
          id: string
          last_name?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          coppa_consented?: boolean
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["profile_status"]
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
      rubric_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lab_id: string
          max_points: number
          position: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lab_id: string
          max_points?: number
          position?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lab_id?: string
          max_points?: number
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_items_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_scores: {
        Row: {
          id: string
          lab_run_id: string
          rubric_item_id: string
          self_score: number | null
          teacher_comment: string | null
          teacher_score: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          lab_run_id: string
          rubric_item_id: string
          self_score?: number | null
          teacher_comment?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          lab_run_id?: string
          rubric_item_id?: string
          self_score?: number | null
          teacher_comment?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_scores_lab_run_id_fkey"
            columns: ["lab_run_id"]
            isOneToOne: false
            referencedRelation: "student_lab_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_rubric_item_id_fkey"
            columns: ["rubric_item_id"]
            isOneToOne: false
            referencedRelation: "rubric_items"
            referencedColumns: ["id"]
          },
        ]
      }
      step_responses: {
        Row: {
          completed: boolean
          data_values: Json | null
          flags: Json | null
          id: string
          lab_run_id: string
          reflection_text: string | null
          saved_at: string
          step_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          data_values?: Json | null
          flags?: Json | null
          id?: string
          lab_run_id: string
          reflection_text?: string | null
          saved_at?: string
          step_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          data_values?: Json | null
          flags?: Json | null
          id?: string
          lab_run_id?: string
          reflection_text?: string | null
          saved_at?: string
          step_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_responses_lab_run_id_fkey"
            columns: ["lab_run_id"]
            isOneToOne: false
            referencedRelation: "student_lab_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_responses_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "lab_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          graded_at: string
          id: string
          lab_run_id: string
          letter_grade: string | null
          max_score: number | null
          overall_comment: string | null
          teacher_id: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          graded_at?: string
          id?: string
          lab_run_id: string
          letter_grade?: string | null
          max_score?: number | null
          overall_comment?: string | null
          teacher_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          graded_at?: string
          id?: string
          lab_run_id?: string
          letter_grade?: string | null
          max_score?: number | null
          overall_comment?: string | null
          teacher_id?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_lab_run_id_fkey"
            columns: ["lab_run_id"]
            isOneToOne: true
            referencedRelation: "student_lab_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_lab_runs: {
        Row: {
          assignment_id: string
          completed_at: string | null
          current_step: number
          id: string
          lab_id: string
          prelab_completed: boolean
          quick_note: string | null
          started_at: string
          status: Database["public"]["Enums"]["student_work_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          current_step?: number
          id?: string
          lab_id: string
          prelab_completed?: boolean
          quick_note?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["student_work_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          current_step?: number
          id?: string
          lab_id?: string
          prelab_completed?: boolean
          quick_note?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["student_work_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_lab_runs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "lab_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lab_runs_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lab_runs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_materials: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          organization_id: string
          size_bytes: number | null
          storage_path: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          organization_id: string
          size_bytes?: number | null
          storage_path: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          organization_id?: string
          size_bytes?: number | null
          storage_path?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          theme: Database["public"]["Enums"]["theme_preference"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      generate_org_code: { Args: never; Returns: string }
      is_teacher_of_class: {
        Args: { p_class_id: string; p_teacher_id: string }
        Returns: boolean
      }
      lookup_org_by_signup_code: {
        Args: { code: string }
        Returns: Database["public"]["CompositeTypes"]["signup_code_lookup"]
        SetofOptions: {
          from: "*"
          to: "signup_code_lookup"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_org: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      student_enrolled_in_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: boolean
      }
      teacher_can: {
        Args: { p_class_id: string; p_permission: string }
        Returns: boolean
      }
      teacher_has_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
    }
    Enums: {
      lab_status: "draft" | "published" | "archived"
      profile_status: "active" | "pending_review"
      student_work_status:
        | "on_track"
        | "need_help"
        | "stuck"
        | "waiting_for_check"
        | "finished_step"
      theme_preference: "light" | "dark" | "system"
      user_role: "teacher" | "student" | "school_admin" | "super_admin"
    }
    CompositeTypes: {
      signup_code_lookup: {
        org_id: string | null
        assigned_role: Database["public"]["Enums"]["user_role"] | null
      }
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
      lab_status: ["draft", "published", "archived"],
      profile_status: ["active", "pending_review"],
      student_work_status: [
        "on_track",
        "need_help",
        "stuck",
        "waiting_for_check",
        "finished_step",
      ],
      theme_preference: ["light", "dark", "system"],
      user_role: ["teacher", "student", "school_admin", "super_admin"],
    },
  },
} as const
