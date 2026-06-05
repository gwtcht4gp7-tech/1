import { BottomNavigation, TopNavigation } from "@/components/navigation";
import type { Locale } from "@/lib/i18n";

export function AppShell({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <TopNavigation locale={locale} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 md:pb-10">
        {children}
      </main>
      <BottomNavigation locale={locale} />
    </div>
  );
}
