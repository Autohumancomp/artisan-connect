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
  public: {
    Tables: {
      artisans: {
        Row: {
          adresse: string | null
          created_at: string
          email: string
          email_contact: string | null
          frequence_relance_defaut: number
          id: string
          modele_message: string
          nom_entreprise: string
          statut_abonnement: Database["public"]["Enums"]["statut_abonnement"]
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email: string
          email_contact?: string | null
          frequence_relance_defaut?: number
          id?: string
          modele_message?: string
          nom_entreprise: string
          statut_abonnement?: Database["public"]["Enums"]["statut_abonnement"]
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string
          email_contact?: string | null
          frequence_relance_defaut?: number
          id?: string
          modele_message?: string
          nom_entreprise?: string
          statut_abonnement?: Database["public"]["Enums"]["statut_abonnement"]
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          artisan_id: string
          created_at: string
          date_dernier_entretien: string | null
          date_prochaine_relance: string | null
          derniere_relance_envoyee: string | null
          email: string | null
          frequence_relance_mois: number
          id: string
          nom_client: string
          notes: string | null
          statut_relance: Database["public"]["Enums"]["statut_relance"]
          telephone: string | null
          type_equipement: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          artisan_id?: string
          created_at?: string
          date_dernier_entretien?: string | null
          date_prochaine_relance?: string | null
          derniere_relance_envoyee?: string | null
          email?: string | null
          frequence_relance_mois?: number
          id?: string
          nom_client: string
          notes?: string | null
          statut_relance?: Database["public"]["Enums"]["statut_relance"]
          telephone?: string | null
          type_equipement?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          artisan_id?: string
          created_at?: string
          date_dernier_entretien?: string | null
          date_prochaine_relance?: string | null
          derniere_relance_envoyee?: string | null
          email?: string | null
          frequence_relance_mois?: number
          id?: string
          nom_client?: string
          notes?: string | null
          statut_relance?: Database["public"]["Enums"]["statut_relance"]
          telephone?: string | null
          type_equipement?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_relances: {
        Row: {
          artisan_id: string
          client_id: string
          created_at: string
          destinataire: string | null
          envoye_le: string
          erreur: string | null
          id: string
          statut: string
        }
        Insert: {
          artisan_id: string
          client_id: string
          created_at?: string
          destinataire?: string | null
          envoye_le?: string
          erreur?: string | null
          id?: string
          statut?: string
        }
        Update: {
          artisan_id?: string
          client_id?: string
          created_at?: string
          destinataire?: string | null
          envoye_le?: string
          erreur?: string | null
          id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_relances_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_relances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_artisan_id_actif: { Args: never; Returns: string }
    }
    Enums: {
      statut_abonnement: "essai" | "actif" | "suspendu"
      statut_relance: "a_venir" | "a_relancer" | "relance"
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
      statut_abonnement: ["essai", "actif", "suspendu"],
      statut_relance: ["a_venir", "a_relancer", "relance"],
    },
  },
} as const
