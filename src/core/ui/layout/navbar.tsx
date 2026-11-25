"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Vote,
  X,
} from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { ROLE_META } from "@/core/config/official-data";
import { logoutAction } from "@/modules/accounts/actions";
import { cn, getInitials } from "@/core/utils";
import type { CurrentUserContext } from "@/core/types/database";

const NAV_GROUPS = [
  {
    id: "kengash",
    label: "Kengash",
    prefixes: ["/haqida", "/nizom", "/yonalishlar", "/maktablar", "/kelajak-liderlari", "/koordinatorlar"],
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
    id: "loyihalar",
    label: "Loyihalar",
    prefixes: ["/loyihalar", "/goliblar", "/amalga-oshirilayotgan"],
    items: [
      { href: "/loyihalar", label: "Loyihalar katalogi", desc: "Barcha tashabbus va g‘oyalar" },
      { href: "/goliblar", label: "Haftalik g‘oliblar", desc: "G‘olib loyihalar arxivi" },
      { href: "/amalga-oshirilayotgan", label: "Monitoring", desc: "Amalga oshirilayotgan ishlar" },
    ],
  },
  {
    id: "faoliyat",
    label: "Faoliyat",
    prefixes: ["/reyting", "/yangiliklar", "/tadbirlar"],
    items: [
      { href: "/reyting", label: "Maktablar reytingi", desc: "61 ta maktab faollik reytingi" },
      { href: "/yangiliklar", label: "Yangiliklar", desc: "So‘nggi e’lon va xabarlar" },
      { href: "/tadbirlar", label: "Tadbirlar", desc: "Rejalashtirilgan va o‘tkazilgan" },
    ],
  },
];

export function Navbar({
  userCtx,
  adminPath,
}: {
  userCtx: CurrentUserContext | null;
  adminPath?: string | null;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const activeNavId =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/ovoz-berish")
      ? "voting"
      : NAV_GROUPS.find((g) => g.prefixes.some((p) => pathname.startsWith(p)))?.id || null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200 bk-glass",
        scrolled
          ? "border-[#DCE5F5] dark:border-[#22345A] shadow-sm shadow-[#0B1224]/[0.05]"
          : "border-[#DCE5F5]/70 dark:border-[#22345A]/70"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#2563EB] to-[#22D3EE] text-white shadow-lg shadow-[#4F46E5]/30 transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight min-w-0">
            <span className="block truncate font-display text-sm font-extrabold text-[#172033] dark:text-white sm:text-base">
              Baliqchi Kengashi
            </span>
            <span className="hidden xs:block sm:block truncate text-[11px] font-medium text-[#64748B] dark:text-[#38BDF8]/85">
              61 maktab • O‘quvchilar Kengashi
            </span>
          </div>
        </Link>

        {/* Desktop Nav with Framer Motion animated active indicator */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Asosiy navigatsiya">
          <Link
            href="/"
            className={cn(
              "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
              activeNavId === "home"
                ? "text-[#2563EB] dark:text-[#38BDF8]"
                : "text-[#172033] dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
            )}
          >
            {activeNavId === "home" && (
              <motion.span
                layoutId="nav-active-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 -z-10 rounded-xl bg-[#2563EB]/10 dark:bg-[#3B82F6]/20"
              />
            )}
            Bosh sahifa
          </Link>

          {NAV_GROUPS.map((group) => {
            const isActive = activeNavId === group.id;
            const isOpen = openDropdown === group.id;
            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setOpenDropdown(group.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  className={cn(
                    "relative inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer",
                    isActive
                      ? "text-[#2563EB] dark:text-[#38BDF8]"
                      : "text-[#172033] dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-[#38BDF8]"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-10 rounded-xl bg-[#2563EB]/10 dark:bg-[#3B82F6]/20"
                    />
                  )}
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-70 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute left-0 top-full pt-2 w-72"
                    >
                      <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#111C35] p-2 shadow-xl shadow-[#0B1224]/10 dark:shadow-black/45">
                        {group.items.map((item) => {
                          const itemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpenDropdown(null)}
                              className={cn(
                                "block rounded-xl px-3.5 py-2.5 transition-colors",
                                itemActive
                                  ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#3B82F6]/20 dark:text-[#38BDF8]"
                                  : "hover:bg-[#F5F8FF] dark:hover:bg-[#172544]"
                              )}
                            >
                              <div className="text-sm font-semibold text-[#172033] dark:text-white">
                                {item.label}
                              </div>
                              <div className="text-xs text-[#64748B] dark:text-slate-400">
                                {item.desc}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <Link
            href="/ovoz-berish"
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
              activeNavId === "voting"
                ? "text-white"
                : "text-[#10B981] dark:text-[#34D399] hover:bg-[#10B981]/10"
            )}
          >
            {activeNavId === "voting" && (
              <motion.span
                layoutId="nav-active-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981]"
              />
            )}
            <Vote className="h-4 w-4" />
            Ovoz berish
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            aria-label="Mavzuni almashtirish"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE5F5] dark:border-[#22345A] text-[#172033] dark:text-slate-200 hover:bg-[#F5F8FF] dark:hover:bg-[#172544] transition-colors cursor-pointer"
          >
            <Sun className="h-4 w-4 hidden dark:block" />
            <Moon className="h-4 w-4 block dark:hidden" />
          </button>

          {userCtx ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                href="/guruhlar"
                title="8 ta boshqaruv guruhi"
                aria-label="Guruhlar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE5F5] dark:border-[#22345A] text-[#172033] dark:text-slate-200 hover:bg-[#F5F8FF] dark:hover:bg-[#172544] transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link
                href="/bildirishnomalar"
                title="Bildirishnomalar"
                aria-label="Bildirishnomalar"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE5F5] dark:border-[#22345A] text-[#172033] dark:text-slate-200 hover:bg-[#F5F8FF] dark:hover:bg-[#172544] transition-colors"
              >
                <Bell className="h-4 w-4" />
                {userCtx.unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {userCtx.unreadNotificationsCount}
                  </span>
                )}
              </Link>
              {userCtx.isSuperAdmin && adminPath && (
                <Link href={adminPath}>
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
                  <span className="max-w-[96px] truncate">{userCtx.user.first_name}</span>
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  title="Chiqish"
                  aria-label="Chiqish"
                  className="h-9 w-9"
                >
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
            aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE5F5] dark:border-[#22345A] lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#0B1224] lg:hidden"
          >
            <div className="px-4 py-4 max-h-[80vh] overflow-y-auto space-y-4">
              {userCtx && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F5F8FF] dark:bg-[#111C35] p-3.5 border border-[#DCE5F5] dark:border-[#22345A]">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#172033] dark:text-white truncate">
                      {userCtx.user.first_name} {userCtx.user.last_name}
                    </div>
                    <div className="text-xs text-[#64748B] dark:text-slate-400">
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
                    {userCtx.isSuperAdmin && adminPath && (
                      <Link href={adminPath} onClick={() => setMobileOpen(false)}>
                        <Button size="sm" variant="danger">
                          Admin
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-[#DCE5F5] dark:border-[#22345A] px-3 py-2.5 text-center text-sm font-semibold"
                >
                  Bosh sahifa
                </Link>
                <Link
                  href="/ovoz-berish"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Ovoz berish
                </Link>
              </div>

              {NAV_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8] font-semibold"
                            : "text-[#172033] dark:text-slate-200 hover:bg-[#F5F8FF] dark:hover:bg-[#111C35]"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {userCtx ? (
                <div className="flex flex-wrap gap-2 border-t border-[#DCE5F5] dark:border-[#22345A] pt-3">
                  <Link href="/guruhlar" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Guruhlar
                    </Button>
                  </Link>
                  <Link href="/bildirishnomalar" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Xabarlar ({userCtx.unreadNotificationsCount})
                    </Button>
                  </Link>
                  <form action={logoutAction} className="w-full">
                    <Button variant="ghost" className="w-full text-rose-600" size="sm" type="submit">
                      Chiqish
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 border-t border-[#DCE5F5] dark:border-[#22345A] pt-3">
                  <Link href="/kirish" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Kirish
                    </Button>
                  </Link>
                  <Link href="/royxatdan-otish" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Qo‘shilish
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
