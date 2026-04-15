export type WorkspaceKind = "personal" | "business";
export type WorkspaceScope = WorkspaceKind | "all";
export type MovementKind = "income" | "expense";
export type AccountType = "cash" | "bank" | "wallet" | "credit_card" | "savings";
export type FinancialProduct = "bank_account" | "credit_card" | "loan";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  onboarding_mode: "personal_only" | "personal_and_business" | null;
  onboarding_completed: boolean;
  financial_products: FinancialProduct[];
  monthly_income_estimate: number | null;
  monthly_expense_estimate: number | null;
  created_at: string;
  updated_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  workspace?: Pick<Workspace, "id" | "name" | "kind"> | null;
};

export type Account = {
  id: string;
  workspace_id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  initial_balance: number;
  is_active: boolean;
  created_at: string;
  workspace?: Pick<Workspace, "id" | "name" | "kind"> | null;
};

export type Category = {
  id: string;
  workspace_id: string;
  name: string;
  kind: MovementKind;
  created_at: string;
  workspace?: Pick<Workspace, "id" | "name" | "kind"> | null;
};

export type Movement = {
  id: string;
  workspace_id: string;
  movement_date: string;
  description: string;
  amount: number;
  kind: MovementKind;
  account_id: string;
  category_id: string;
  notes: string | null;
  created_at: string;
  account?: Pick<Account, "name"> | null;
  category?: Pick<Category, "name"> | null;
  workspace?: Pick<Workspace, "id" | "name" | "kind"> | null;
};
