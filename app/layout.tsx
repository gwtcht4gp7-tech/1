import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusBoard",
  description: "A personal productivity dashboard for todos, habits, and finance.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body>
        <ServiceWorkerRegister />
        <AppShell locale={locale}>{children}</AppShell>
      </body>
    </html>
  );
}
