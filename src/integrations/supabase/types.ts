export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data: string
          data_desejada: string
          horario_desejado: string
          id: string
          locatario_id: string | null
          moto_id: string | null
          nome_solicitante: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_agendamento"]
          telefone_contato: string
          tipo_manutencao: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          data_desejada: string
          horario_desejado: string
          id?: string
          locatario_id?: string | null
          moto_id?: string | null
          nome_solicitante: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          telefone_contato: string
          tipo_manutencao: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          data_desejada?: string
          horario_desejado?: string
          id?: string
          locatario_id?: string | null
          moto_id?: string | null
          nome_solicitante?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_agendamento"]
          telefone_contato?: string
          tipo_manutencao?: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_locatario_id_fkey"
            columns: ["locatario_id"]
            isOneToOne: false
            referencedRelation: "locatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
        ]
      }
      locatarios: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          rg: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo: string
          rg: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          rg?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      motos: {
        Row: {
          cor: string
          created_at: string
          id: string
          km_total: number | null
          modelo: string
          numero_chassi: string | null
          numero_motor: string | null
          placa: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cor: string
          created_at?: string
          id?: string
          km_total?: number | null
          modelo: string
          numero_chassi?: string | null
          numero_motor?: string | null
          placa: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          km_total?: number | null
          modelo?: string
          numero_chassi?: string | null
          numero_motor?: string | null
          placa?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pdfs_gerados: {
        Row: {
          created_at: string
          data_vistoria: string
          id: string
          locatario_id: string | null
          moto_id: string | null
          nome_arquivo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          data_vistoria: string
          id?: string
          locatario_id?: string | null
          moto_id?: string | null
          nome_arquivo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          data_vistoria?: string
          id?: string
          locatario_id?: string | null
          moto_id?: string | null
          nome_arquivo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdfs_gerados_locatario_id_fkey"
            columns: ["locatario_id"]
            isOneToOne: false
            referencedRelation: "locatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdfs_gerados_moto_id_fkey"
            columns: ["moto_id"]
            isOneToOne: false
            referencedRelation: "motos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdfs_gerados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_logo: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: number
          is_approved: boolean | null
          is_frozen: boolean | null
          name: string
          phone: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          id?: number
          is_approved?: boolean | null
          is_frozen?: boolean | null
          name: string
          phone?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: number
          is_approved?: boolean | null
          is_frozen?: boolean | null
          name?: string
          phone?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          assinatura_expira_em: string | null
          ativo: boolean
          cnpj: string | null
          created_at: string
          email: string
          id: string
          nome_completo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assinatura_expira_em?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          nome_completo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assinatura_expira_em?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      status_agendamento: "pendente" | "confirmado" | "concluido" | "cancelado"
      tipo_manutencao: "preventiva" | "corretiva" | "troca_oleo"
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
      status_agendamento: ["pendente", "confirmado", "concluido", "cancelado"],
      tipo_manutencao: ["preventiva", "corretiva", "troca_oleo"],
    },
  },
} as const
