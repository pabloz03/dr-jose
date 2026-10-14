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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointment_tokens: {
        Row: {
          appointment_id: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          expires_at: string
          id?: string
          purpose: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          bookable_online: boolean
          buffer_after_min: number
          duration_min: number
          id: string
          is_active: boolean
          name: string
          sort: number
        }
        Insert: {
          bookable_online?: boolean
          buffer_after_min?: number
          duration_min: number
          id?: string
          is_active?: boolean
          name: string
          sort?: number
        }
        Update: {
          bookable_online?: boolean
          buffer_after_min?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          sort?: number
        }
        Relationships: []
      }
      appointments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          clinic_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id: string
          ends_at: string
          id?: string
          patient_id: string
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          source: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          clinic_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          ends_at?: string
          id?: string
          patient_id?: string
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          source?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_type: string
          actor_user_id?: string | null
          at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      clinic_hours: {
        Row: {
          clinic_id: string
          doctor_id: string
          end_time: string
          id: string
          start_time: string
          week_of_month: number | null
          weekday: number
        }
        Insert: {
          clinic_id: string
          doctor_id: string
          end_time: string
          id?: string
          start_time: string
          week_of_month?: number | null
          weekday: number
        }
        Update: {
          clinic_id?: string
          doctor_id?: string
          end_time?: string
          id?: string
          start_time?: string
          week_of_month?: number | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_hours_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_hours_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          clinic_id: string
          max_booking_days: number
          min_cancel_hours: number
          min_lead_hours: number
          reminder_local_time: string
          slot_step_min: number
        }
        Insert: {
          clinic_id: string
          max_booking_days?: number
          min_cancel_hours?: number
          min_lead_hours?: number
          reminder_local_time?: string
          slot_step_min?: number
        }
        Update: {
          clinic_id?: string
          max_booking_days?: number
          min_cancel_hours?: number
          min_lead_hours?: number
          reminder_local_time?: string
          slot_step_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_staff: {
        Row: {
          clinic_id: string
          staff_id: string
        }
        Insert: {
          clinic_id: string
          staff_id: string
        }
        Update: {
          clinic_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          maps_url: string | null
          name: string
          phone: string | null
          timezone: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          maps_url?: string | null
          name: string
          phone?: string | null
          timezone?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          maps_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          appointment_id: string | null
          channel: string
          error: string | null
          id: string
          kind: string
          provider_id: string | null
          sent_at: string
          status: string
          to_email: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          error?: string | null
          id?: string
          kind: string
          provider_id?: string | null
          sent_at?: string
          status?: string
          to_email?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          error?: string | null
          id?: string
          kind?: string
          provider_id?: string | null
          sent_at?: string
          status?: string
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          contact_email: string | null
          created_at: string
          deleted_at: string | null
          full_name: string
          guardian_user_id: string | null
          id: string
          is_self: boolean
        }
        Insert: {
          birth_date?: string | null
          contact_email?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name: string
          guardian_user_id?: string | null
          id?: string
          is_self?: boolean
        }
        Update: {
          birth_date?: string | null
          contact_email?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          guardian_user_id?: string | null
          id?: string
          is_self?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          locale: string
          notify_email: boolean
          phone: string | null
          privacy_consent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          locale?: string
          notify_email?: boolean
          phone?: string | null
          privacy_consent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          locale?: string
          notify_email?: boolean
          phone?: string | null
          privacy_consent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedule_exceptions: {
        Row: {
          clinic_id: string
          doctor_id: string
          end_time: string | null
          id: string
          is_closed: boolean
          note: string | null
          on_date: string
          start_time: string | null
        }
        Insert: {
          clinic_id: string
          doctor_id: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          note?: string | null
          on_date: string
          start_time?: string | null
        }
        Update: {
          clinic_id?: string
          doctor_id?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          note?: string | null
          on_date?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_exceptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      time_off: {
        Row: {
          clinic_id: string | null
          created_at: string
          doctor_id: string
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          doctor_id: string
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          doctor_id?: string
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      appointments_affected_by: {
        Args: {
          p_clinic: string
          p_doctor: string
          p_from: string
          p_to: string
        }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      auto_confirm_due_appointments: {
        Args: never
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      book_appointment: {
        Args: {
          p_clinic: string
          p_doctor: string
          p_patient: string
          p_start: string
          p_type: string
        }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      book_appointment_staff: {
        Args: {
          p_clinic: string
          p_doctor: string
          p_patient: string
          p_start: string
          p_type: string
        }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_appointment: {
        Args: { p_id: string; p_reason?: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_patients: {
        Args: { p_patient_ids: string[] }
        Returns: {
          birth_date: string | null
          contact_email: string | null
          created_at: string
          deleted_at: string | null
          full_name: string
          guardian_user_id: string | null
          id: string
          is_self: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "patients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claimable_guest_patients: {
        Args: never
        Returns: {
          birth_date: string | null
          contact_email: string | null
          created_at: string
          deleted_at: string | null
          full_name: string
          guardian_user_id: string | null
          id: string
          is_self: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "patients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      confirm_appointment: {
        Args: { p_id: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      due_reminders: {
        Args: never
        Returns: {
          appointment_id: string
        }[]
      }
      get_available_slots: {
        Args: {
          p_clinic: string
          p_doctor: string
          p_from: string
          p_ignore_lead_time?: boolean
          p_to: string
          p_type: string
        }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      get_dashboard_appointment_metrics: {
        Args: { p_from: string; p_to: string }
        Returns: {
          clinic_id: string
          clinic_name: string
          day: string
          n_appointments: number
          n_confirmed: number
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          type_name: string
        }[]
      }
      get_dashboard_new_patients: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          n_new_patients: number
        }[]
      }
      guest_book_appointment: {
        Args: {
          p_clinic: string
          p_contact_email: string
          p_doctor: string
          p_full_name: string
          p_start: string
          p_type: string
        }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_doctor: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_appointment_attendance: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reschedule_appointment: {
        Args: { p_id: string; p_new_start: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      token_cancel_appointment: {
        Args: { p_id: string; p_reason?: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      token_confirm_appointment: {
        Args: { p_id: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      token_reschedule_appointment: {
        Args: { p_id: string; p_new_start: string }
        Returns: {
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          patient_id: string
          reminder_sent_at: string | null
          rescheduled_from: string | null
          source: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          type_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "completed"
        | "no_show"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "cancelled",
        "rescheduled",
        "completed",
        "no_show",
      ],
    },
  },
} as const
