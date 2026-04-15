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
          workspace_id: string;
        };
        Insert: {
          account_type: "cash" | "bank" | "wallet" | "credit_card" | "savings";
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          is_active?: boolean;
          name: string;
          workspace_id: string;
        };
        Update: {
          account_type?: "cash" | "bank" | "wallet" | "credit_card" | "savings";
          created_at?: string;
          currency?: string;
          id?: string;
          initial_balance?: number;
          is_active?: boolean;
          name?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          kind: "income" | "expense";
          name: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: "income" | "expense";
          name: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: "income" | "expense";
          name?: string;
          workspace_id?: string;
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
          workspace_id: string;
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
          workspace_id: string;
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
          workspace_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          financial_products: ("bank_account" | "credit_card" | "loan")[];
          full_name: string | null;
          id: string;
          monthly_expense_estimate: number | null;
          monthly_income_estimate: number | null;
          onboarding_completed: boolean;
          onboarding_mode: "personal_only" | "personal_and_business" | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          financial_products?: ("bank_account" | "credit_card" | "loan")[];
          full_name?: string | null;
          id: string;
          monthly_expense_estimate?: number | null;
          monthly_income_estimate?: number | null;
          onboarding_completed?: boolean;
          onboarding_mode?: "personal_only" | "personal_and_business" | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          financial_products?: ("bank_account" | "credit_card" | "loan")[];
          full_name?: string | null;
          id?: string;
          monthly_expense_estimate?: number | null;
          monthly_income_estimate?: number | null;
          onboarding_completed?: boolean;
          onboarding_mode?: "personal_only" | "personal_and_business" | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: "owner" | "member";
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role?: "owner" | "member";
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          role?: "owner" | "member";
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          kind: "personal" | "business";
          name: string;
          owner_user_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: "personal" | "business";
          name: string;
          owner_user_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: "personal" | "business";
          name?: string;
          owner_user_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: {
          selected_mode: "personal_only" | "personal_and_business";
          business_workspace_name?: string;
        };
        Returns: {
          personal_workspace_id: string;
          business_workspace_id: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
