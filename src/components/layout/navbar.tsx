"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_META } from "@/lib/constants/official-data";
import { logoutAction } from "@/actions/auth";
import { cn, getInitials } from "@/lib/utils";
import type { CurrentUserContext } from "@/types/database";

const NAV_GROUPS = [
  {
    label: "Kengash",
    items: [
      { href: "/haqida", label: "Platforma haqida", desc: "Missiya va tuman tuzilmasi" },
      { href: "/nizom", label: "Rasmiy Nizom", desc: "365-son buyruq, 2-ilova" },
      { href: "/yonalishlar", label: "7 ta yo‘nalish", desc: "Kengash asosiy sohalari" },
      { href: "/maktablar", label: "61 ta maktab", desc: "Har bir maktab raqamli profili" },
      { href: "/kelajak-liderlari", label: "Kelajak Liderlari", desc: "Tuman va 61 maktab liderlari" },
      { href: "/koordinatorlar", label: "Koordinatorlar", desc: "Yo‘nalish koordinatorlari" },
    ],
  },
  {
    label: "Loyihalar",
    items: [
      { href: "/loyihalar", label: "Loyihalar katalogi", desc: "Barcha tashabbus va g‘oyalar" },
      { href: "/ovoz-berish", label: "Haftalik ovoz berish", desc: "Haftasiga 1 ta adolatli ovoz" },
      { href: "/goliblar", label: "Haftalik g‘oliblar", desc: "G‘olib loyihalar arxivi" },
      { href: "/amalga-oshirilayotgan", label: "Amalga oshirilayotgan", desc: "Real jarayon va monitoring" },
    ],
  },
  {
    label: "Faoliyat",
    items: [
      { href: "/reyting", label: "Maktablar reytingi", desc: "61 ta maktab faollik reytingi" },
      { href: "/yangiliklar", label: "Yangiliklar", desc: "So‘nggi e’lon va xabarlar" },
      { href: "/tadbirlar", label: "Tadbirlar", desc: "Rejalashtirilgan va o‘tkazilgan" },
    ],
  },
];

export function Navbar({ userCtx }: { userCtx: CurrentUserContext | null }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bk-glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-teal-500 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block font-display text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              Baliqchi Kengashi
            </span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-sky-300/80">
              61 maktab • O‘quvchilar Kengashi
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "text-blue-600 dark:text-sky-400 bg-blue-500/10"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
            )}
          >
            Bosh sahifa
          </Link>

          {NAV_GROUPS.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpenDropdown(group.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === group.label ? null : group.label)
                }
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                {group.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {openDropdown === group.label && (
                <div className="absolute left-0 top-full pt-2 w-72">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0c172c] p-2 shadow-xl shadow-slate-900/10 dark:shadow-black/40">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "block rounded-xl px-3 py-2.5 transition-colors",
                          pathname === item.href
                            ? "bg-blue-500/10 text-blue-600 dark:text-sky-400"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        )}
                      >
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link
            href="/ovoz-berish"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              pathname === "/ovoz-berish"
                ? "text-white bg-blue-600"
                : "text-blue-600 dark:text-sky-400 hover:bg-blue-500/10"
            )}
          >
            Ovoz berish
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mavzuni almashtirish"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 block dark:hidden" />
          </button>

          {userCtx ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/guruhlar"
                title="Guruhlar va muloqot"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link
                href="/bildirishnomalar"
                title="Bildirishnomalar"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
                {userCtx.unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {userCtx.unreadNotificationsCount}
                  </span>
                )}
              </Link>
              {userCtx.isSuperAdmin && (
                <Link href="/admin">
                  <Button variant="danger" size="sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/kabinet">
                <Button variant="primary" size="sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {getInitials(userCtx.user.first_name, userCtx.user.last_name)}
                  </span>
                  <span className="max-w-[110px] truncate">{userCtx.user.first_name}</span>
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="icon" type="submit" title="Chiqish" className="h-9 w-9">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/kirish">
                <Button variant="ghost" size="sm">
                  Kirish
                </Button>
              </Link>
              <Link href="/royxatdan-otish">
                <Button variant="primary" size="sm">
                  Qo‘shilish
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Menyu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c172c] px-4 py-4 lg:hidden max-h-[82vh] overflow-y-auto">
          <div className="space-y-4">
            {userCtx && (
              <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/70 p-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {userCtx.user.first_name} {userCtx.user.last_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {ROLE_META[userCtx.primaryRole].label}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Link href="/kabinet" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" variant="primary">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Kabinet
                    </Button>
                  </Link>
                  {userCtx.isSuperAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <Button size="sm" variant="danger">
                        Admin
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {userCtx ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <Link href="/guruhlar" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Guruhlar
                  </Button>
                </Link>
                <Link href="/bildirishnomalar" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Bildirishnomalar ({userCtx.unreadNotificationsCount})
                  </Button>
                </Link>
                <form action={logoutAction} className="w-full">
                  <Button variant="ghost" className="w-full text-rose-600" size="sm" type="submit">
                    Chiqish
                  </Button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <Link href="/kirish" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Kirish
                  </Button>
                </Link>
                <Link href="/royxatdan-otish" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Ro‘yxatdan o‘tish
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
