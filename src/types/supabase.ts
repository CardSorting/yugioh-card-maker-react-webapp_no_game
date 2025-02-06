export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          public?: boolean;
          updated_at?: string;
        };
      };
      deck_permissions: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          permissions: string[];
          granted_at: string;
          granted_by: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          permissions: string[];
          granted_at?: string;
          granted_by: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          user_id?: string;
          permissions?: string[];
          granted_by?: string;
        };
      };
    };
    Views: {
      deck_details: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          public: boolean;
          created_at: string;
          updated_at: string;
          main_deck_count: number;
          extra_deck_count: number;
          side_deck_count: number;
          bookmark_count: number;
          is_bookmarked: boolean;
        };
      };
    };
  };
}
