import type { Category, Transaction } from "@prisma/client";
import { deleteTransactionAction } from "@/app/actions/finance";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { TransactionForm } from "@/components/finance/transaction-form";
import { formatDateInput, formatMoney } from "@/lib/domain";

type TransactionWithCategory = Transaction & {
  category: Category;
};

export function TransactionList({
  categories,
  transactions,
  zh = false,
}: Readonly<{
  categories: Category[];
  transactions: TransactionWithCategory[];
  zh?: boolean;
}>) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">
          {zh ? "当前视图没有交易记录" : "No transactions in this view"}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "添加收入或支出后，月度汇总才会更有用。"
            : "Add income or expenses to make the monthly summary useful."}
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      {transactions.map((transaction) => (
        <div
          className="grid gap-3 border-b border-zinc-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
          key={transaction.id}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{transaction.note || transaction.category.name}</p>
              <span
                className="rounded-full px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: transaction.category.color }}
              >
                {transaction.category.name}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {formatDateInput(transaction.date)} · {transaction.type}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            <p
              className={`h-9 leading-9 text-sm font-semibold ${
                transaction.type === "income" ? "text-teal-700" : "text-zinc-900"
              }`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatMoney(transaction.amount)}
            </p>
            <details className="w-full sm:w-auto">
              <summary className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium">
                  {zh ? "编辑" : "Edit"}
              </summary>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:w-96">
                <TransactionForm
                  categories={categories}
                  mode="edit"
                  initialValues={transaction}
                  zh={zh}
                />
              </div>
            </details>
            <form action={deleteTransactionAction}>
              <input name="id" type="hidden" value={transaction.id} />
              <ConfirmSubmitButton
                className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700"
                confirmLabel={zh ? "确认删除" : "Confirm delete"}
                message="Delete this transaction?"
                pendingLabel={zh ? "删除中..." : "Deleting..."}
              >
                {zh ? "删除" : "Delete"}
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      ))}
    </section>
  );
}
