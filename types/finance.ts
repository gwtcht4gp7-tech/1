import type { TransactionTypeValue } from "@/lib/domain";

export type FinanceFilters = {
  month: string;
  type?: TransactionTypeValue | "all";
  categoryId?: string;
};
