import { redirect } from "next/navigation";
import { ClearDataForm } from "@/components/settings/clear-data-form";
import { ExportButtons } from "@/components/settings/export-buttons";
import { LanguageForm } from "@/components/settings/language-form";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, isChinese } from "@/lib/i18n";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  const locale = await getLocale();
  const zh = isChinese(locale);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          {zh ? "设置" : "Settings"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {zh ? "数据与应用设置" : "Data and app settings"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {zh
            ? "管理导出、本地演示数据、语言和应用信息。"
            : "Manage exports, local demo data, and app information."}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "应用信息" : "Application"}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-900">{zh ? "名称" : "Name"}</dt>
              <dd className="text-zinc-600">FocusBoard</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {zh ? "当前账号" : "Signed in as"}
              </dt>
              <dd className="text-zinc-600">{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{zh ? "存储" : "Storage"}</dt>
              <dd className="text-zinc-600">SQLite via Prisma</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "语言" : "Language"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {zh
              ? "切换为中文模式后，主要页面和导航会显示中文。"
              : "Switch between Chinese and English for the main app interface."}
          </p>
          <div className="mt-5">
            <LanguageForm locale={locale} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "导出数据" : "Export data"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {zh
              ? "文件名会包含当天日期，且不会导出敏感环境变量。"
              : "File names include today's date. Sensitive environment variables are never exported."}
          </p>
          <div className="mt-5">
            <ExportButtons zh={zh} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{zh ? "清空演示数据" : "Clear demo data"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {zh
              ? "仅在你想重置当前账号的本地效率数据时使用。"
              : "Use this only when you want to reset local productivity data for the current account."}
          </p>
          <div className="mt-5 max-w-md">
            <ClearDataForm zh={zh} />
          </div>
        </div>
      </section>
    </div>
  );
}
