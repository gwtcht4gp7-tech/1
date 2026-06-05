import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryForm } from "@/components/finance/category-form";
import { MarketAssetForm } from "@/components/finance/market-asset-form";
import { MarketWatchlist } from "@/components/finance/market-watchlist";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureDefaultCategories,
  getCategories,
  getMarketAssets,
  getMonthlyFinanceSummary,
  getTransactionsByFilters,
} from "@/lib/db";
import { formatMoney, formatMonthInput, parseMonthInput, transactionTypes } from "@/lib/domain";
import { getLocale, isChinese } from "@/lib/i18n";
import type { FinanceFilters } from "@/types/finance";

function getFilters(searchParams: { [key: string]: string | string[] | undefined }): FinanceFilters {
  const monthParam = typeof searchParams.month === "string" ? searchParams.month : "";
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "all";
  const categoryId = typeof searchParams.categoryId === "string" ? searchParams.categoryId : "";

  return {
    month: parseMonthInput(monthParam) ? monthParam : formatMonthInput(new Date()),
    type: typeParam === "income" || typeParam === "expense" ? typeParam : "all",
    categoryId,
  };
}

export default async function FinancePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const zh = isChinese(locale);
  await ensureDefaultCategories(user.id);

  const params = await searchParams;
  const filters = getFilters(params);
  const month = parseMonthInput(filters.month) ?? new Date();
  const [categories, summary, transactions, marketAssets] = await Promise.all([
    getCategories(user.id),
    getMonthlyFinanceSummary(user.id, month),
    getTransactionsByFilters(user.id, filters),
    getMarketAssets(user.id),
  ]);
  const balance = summary.income - summary.expense;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            {zh ? "记账" : "Finance"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {zh ? "轻量记账" : "Lightweight money tracking"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {zh
              ? "记录真实收入和支出，按分类与月份查看汇总。"
              : "Track real income and expenses with categories and monthly totals."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "收入" : "Income"}</p>
          <p className="mt-2 text-3xl font-semibold text-teal-700">{formatMoney(summary.income)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "支出" : "Expense"}</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(summary.expense)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{zh ? "结余" : "Balance"}</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(balance)}</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">{zh ? "行情关注" : "Market watchlist"}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {zh
              ? "添加持仓或关注的股票、虚拟币，查看近 30 天简易价格走势。股票默认按美股代码查询，虚拟币支持 BTC、ETH、SOL 等常见代码。"
              : "Add stocks or crypto you hold or watch, then view a simple 30 day price trend. Stocks default to US tickers; crypto supports common symbols like BTC, ETH, and SOL."}
          </p>
        </div>
        <MarketAssetForm zh={zh} />
      </section>

      <MarketWatchlist assets={marketAssets} zh={zh} />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "新增交易" : "New transaction"}</h2>
          <div className="mt-4">
            <TransactionForm categories={categories} mode="create" zh={zh} />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "分类" : "Categories"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                className="rounded-full px-2 py-1 text-xs font-medium text-white"
                key={category.id}
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <CategoryForm zh={zh} />
          </div>
        </div>
      </section>

      <form className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "月份" : "Month"}
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            defaultValue={filters.month}
            name="month"
            type="month"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "类型" : "Type"}
          <select
            className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            defaultValue={filters.type}
            name="type"
          >
            <option value="all">All</option>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          {zh ? "分类" : "Category"}
          <select
            className="h-10 rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            defaultValue={filters.categoryId}
            name="categoryId"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className="h-10 w-full rounded-md border border-zinc-300 px-4 text-sm font-semibold" type="submit">
            {zh ? "应用筛选" : "Apply"}
          </button>
        </div>
      </form>

      <TransactionList categories={categories} transactions={transactions} zh={zh} />

      <Link className="text-sm font-medium text-teal-700" href="/settings">
        {zh ? "导出交易记录" : "Export transactions"}
      </Link>
    </div>
  );
}
