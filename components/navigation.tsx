"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

function getNavItems(locale: Locale) {
  if (locale === "zh") {
    return [
      { href: "/", label: "概览", shortLabel: "首页" },
      { href: "/todos", label: "待办", shortLabel: "待办" },
      { href: "/habits", label: "习惯", shortLabel: "习惯" },
      { href: "/finance", label: "记账", shortLabel: "记账" },
      { href: "/settings", label: "设置", shortLabel: "设置" },
    ];
  }

  return [
    { href: "/", label: "Dashboard", shortLabel: "Home" },
    { href: "/todos", label: "Todos", shortLabel: "Todos" },
    { href: "/habits", label: "Habits", shortLabel: "Habits" },
    { href: "/finance", label: "Finance", shortLabel: "Money" },
    { href: "/settings", label: "Settings", shortLabel: "Settings" },
  ];
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNavigation({ locale }: Readonly<{ locale: Locale }>) {
  const pathname = usePathname();
  const navItems = getNavItems(locale);
  const searchLabel = locale === "zh" ? "搜索" : "Search";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="text-base font-semibold text-zinc-950" href="/">
          FocusBoard
        </Link>
        <form action="/search" className="hidden min-w-56 lg:block">
          <label className="sr-only" htmlFor="global-search">
            {searchLabel}
          </label>
          <input
            className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            id="global-search"
            name="q"
            placeholder={searchLabel}
            type="search"
          />
        </form>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function BottomNavigation({ locale }: Readonly<{ locale: Locale }>) {
  const pathname = usePathname();
  const navItems = getNavItems(locale);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-center px-1 text-xs font-medium ${
                active ? "text-teal-800" : "text-zinc-500"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
