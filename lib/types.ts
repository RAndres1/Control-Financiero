export type OwnerType = "personal" | "business";
export type MovementKind = "income" | "expense";
export type AccountType = "cash" | "bank" | "wallet" | "credit_card" | "savings";

export type Account = {
  id: string;
  name: string;
  owner_type: OwnerType;
  account_type: AccountType;
  currency: string;
  initial_balance: number;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  owner_type: OwnerType;
  kind: MovementKind;
  created_at: string;
};

export type Movement = {
  id: string;
  movement_date: string;
  description: string;
  amount: number;
  kind: MovementKind;
  owner_type: OwnerType;
  account_id: string;
  category_id: string;
  notes: string | null;
  created_at: string;
  account?: Pick<Account, "name"> | null;
  category?: Pick<Category, "name"> | null;
};
