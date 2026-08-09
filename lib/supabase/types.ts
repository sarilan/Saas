// Types générés à partir du schéma Postgres (supabase/migrations).
// En temps normal produits par `supabase gen types typescript --linked
// > lib/supabase/types.ts` une fois le projet Supabase distant lié ; comme
// ce dépôt n'a pas de projet lié pendant la réalisation, ce fichier est
// écrit à la main pour rester la source de vérité en attendant la première
// régénération réelle. Toute modification du schéma doit être répercutée ici.

export type Json = string | number | boolean | null | { [cle: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          niche: string | null;
          plateforme: string | null;
          ton: string | null;
          onboarded: boolean;
          generations_restantes: number;
          abonnement_actif: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          niche?: string | null;
          plateforme?: string | null;
          ton?: string | null;
          onboarded?: boolean;
          generations_restantes?: number;
          abonnement_actif?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          niche?: string | null;
          plateforme?: string | null;
          ton?: string | null;
          onboarded?: boolean;
          generations_restantes?: number;
          abonnement_actif?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          sujet: string;
          plateforme: string;
          ton: string;
          hooks: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sujet: string;
          plateforme: string;
          ton: string;
          hooks: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sujet?: string;
          plateforme?: string;
          ton?: string;
          hooks?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      favoris: {
        Row: {
          id: string;
          user_id: string;
          texte: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          texte: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          texte?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      signalements: {
        Row: {
          id: string;
          user_id: string;
          texte: string;
          motif: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          texte: string;
          motif?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          texte?: string;
          motif?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Profil = Database['public']['Tables']['profiles']['Row'];
export type ProfilUpdate = Database['public']['Tables']['profiles']['Update'];
export type Generation = Database['public']['Tables']['generations']['Row'];
export type Favori = Database['public']['Tables']['favoris']['Row'];
export type Signalement = Database['public']['Tables']['signalements']['Row'];
