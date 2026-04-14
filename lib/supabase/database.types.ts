export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: "cash" | "bank" | "wallet" | "credit_card" | "savings";
          created_at: string;
          currency: string;
          id: string;
          initial_balance: number;
          is_active: boolean;
          name: string;
          owner_type: "personal" | "business";
        };
        Insert: {
          account_type: "cash" | "bank" | "wallet" | "credit_card" | "savings";
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          is_active?: boolean;
          name: string;
          owner_type: "personal" | "business";
        };
        Update: {
          account_type?: "cash" | "bank" | "wallet" | "credit_card" | "savings";
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          is_active?: boolean;
          name?: string;
          owner_type?: "personal" | "business";
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          kind: "income" | "expense";
          name: string;
          owner_type: "personal" | "business";
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: "income" | "expense";
          name: string;
          owner_type: "personal" | "business";
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: "income" | "expense";
          name?: string;
          owner_type?: "personal" | "business";
        };
        Relationships: [];
      };
      movements: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string;
          created_at: string;
          description: string;
          id: string;
          kind: "income" | "expense";
          movement_date: string;
          notes: string | null;
          owner_type: "personal" | "business";
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id: string;
          created_at?: string;
          description: string;
          id?: string;
          kind: "income" | "expense";
          movement_date: string;
          notes?: string | null;
          owner_type: "personal" | "business";
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          kind?: "income" | "expense";
          movement_date?: string;
          notes?: string | null;
          owner_type?: "personal" | "business";
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
