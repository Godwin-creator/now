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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          id: number
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          nom: string
          profil: string
          retards_precedents: number
          secteur: string | null
          telephone: string | null
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          profil: string
          retards_precedents?: number
          secteur?: string | null
          telephone?: string | null
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          profil?: string
          retards_precedents?: number
          secteur?: string | null
          telephone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          digest_actif: boolean
          email: string | null
          id: string
          nom: string
          seuil_montant_eleve: number
        }
        Insert: {
          created_at?: string | null
          digest_actif?: boolean
          email?: string | null
          id: string
          nom?: string
          seuil_montant_eleve?: number
        }
        Update: {
          created_at?: string | null
          digest_actif?: boolean
          email?: string | null
          id?: string
          nom?: string
          seuil_montant_eleve?: number
        }
        Relationships: []
      }
      factures: {
        Row: {
          canal_contact: string
          client_id: string
          company_id: string
          created_at: string | null
          date_echeance: string
          date_service: string
          delai_paiement_jours: number | null
          id: string
          montant_fcfa: number
          numero: string
          statut: string
          type_relation: string
        }
        Insert: {
          canal_contact: string
          client_id: string
          company_id: string
          created_at?: string | null
          date_echeance: string
          date_service: string
          delai_paiement_jours?: number | null
          id?: string
          montant_fcfa: number
          numero?: string
          statut?: string
          type_relation: string
        }
        Update: {
          canal_contact?: string
          client_id?: string
          company_id?: string
          created_at?: string | null
          date_echeance?: string
          date_service?: string
          delai_paiement_jours?: number | null
          id?: string
          montant_fcfa?: number
          numero?: string
          statut?: string
          type_relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_company_client_fkey"
            columns: ["client_id", "company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "factures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          company_id: string
          created_at: string | null
          date_paiement: string | null
          facture_id: string
          id: string
          montant_paye: number
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_paiement?: string | null
          facture_id: string
          id?: string
          montant_paye: number
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_paiement?: string | null
          facture_id?: string
          id?: string
          montant_paye?: number
        }
        Relationships: [
          {
            foreignKeyName: "paiements_company_facture_fkey"
            columns: ["facture_id", "company_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      relances: {
        Row: {
          canal: string
          company_id: string
          created_at: string | null
          envoyee_at: string | null
          facture_id: string
          id: string
          message_genere: string
          source: string
          statut_envoi: string
        }
        Insert: {
          canal: string
          company_id: string
          created_at?: string | null
          envoyee_at?: string | null
          facture_id: string
          id?: string
          message_genere: string
          source?: string
          statut_envoi?: string
        }
        Update: {
          canal?: string
          company_id?: string
          created_at?: string | null
          envoyee_at?: string | null
          facture_id?: string
          id?: string
          message_genere?: string
          source?: string
          statut_envoi?: string
        }
        Relationships: [
          {
            foreignKeyName: "relances_company_facture_fkey"
            columns: ["facture_id", "company_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_quota: {
        Args: { p_kind: string; p_max_heure: number; p_max_jour: number }
        Returns: boolean
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
    Enums: {},
  },
} as const
