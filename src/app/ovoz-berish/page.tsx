import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck, Vote } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { CountdownTimer } from "@/core/ui/shared/countdown-timer";
import { VotingBoard } from "@/modules/voting/components/voting-board";
import { getActiveVotingData, getCurrentUserContext, getDirections } from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Haftalik ovoz berish",
};

export default async function WeeklyVotingPage() {
  const userCtx = await getCurrentUserContext();
  const [{ activeWeek, nominees, userVotedProjectId }, directions] = await Promise.all([
    getActiveVotingData(userCtx?.user.id),
    getDirections(),
  ]);

  return (
    <div>
      <PageHeader
        badge="Adolatli va shaffof ovoz berish tizimi"
        title="Haftalik ovoz berish"
        description="ASOSIY QOIDA: Har bir ro‘yxatdan o‘tgan va tasdiqlangan o‘quvchi haftasiga barcha 7 ta yo‘nalish bo‘yicha JAMI 1 TA loyihaga ovoz bera oladi."
      >
        {activeWeek && <CountdownTimer endsAt={activeWeek.ends_at} />}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 rounded-3xl border-[#2563EB]/25 bg-[#2563EB]/[0.04] lg:col-span-2">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#2563EB] dark:text-[#38BDF8] mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm">
                <div className="font-display font-bold text-[#172033] dark:text-white">
                  Server tomonida atomar himoyalangan ovoz berish
                </div>
                <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
                  Bir foydalanuvchi bir haftada istalgan bitta yo‘nalishdagi faqat bitta loyihaga ovoz bera oladi.
                  Takroriy ovozlar PostgreSQL darajasida bloklanadi. Haftalik g‘olib avval Tuman Kelajak Lideri va
                  yo‘nalish koordinatori tomonidan ko‘rib chiqiladi.
                </p>
                {activeWeek && (
                  <p className="pt-1 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                    Davr: {formatUzDate(activeWeek.starts_at, true)} — {formatUzDate(activeWeek.ends_at, true)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-3xl flex flex-col justify-center">
            {!userCtx ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-white">
                  <Lock className="h-4 w-4 text-amber-500" />
                  Ovoz berish uchun kiring
                </div>
                <div className="flex gap-2">
                  <Link href="/kirish?redirect=/ovoz-berish" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Kirish
                    </Button>
                  </Link>
                  <Link href="/royxatdan-otish" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Qo‘shilish
                    </Button>
                  </Link>
                </div>
              </div>
            ) : userVotedProjectId ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" />
                  Joriy haftadagi ovozingiz berildi
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Keyingi haftalik ovoz berish ochilganda yangi loyihaga ovoz berishingiz mumkin.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2563EB] dark:text-[#38BDF8]">
                  <Vote className="h-5 w-5" />
                  Sizda 1 ta faol ovoz mavjud!
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Eng munosib loyihani tanlab, tasdiqlash oynasi orqali ovoz bering.
                </p>
              </div>
            )}
          </Card>
        </div>

        {activeWeek && nominees.length > 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-extrabold text-[#172033] dark:text-white">
                {activeWeek.title} — Nomzod loyihalar ({nominees.length})
              </h2>
              <Link href="/goliblar">
                <Button variant="outline" size="sm">Haftalik g‘oliblar arxivi</Button>
              </Link>
            </div>

            <VotingBoard
              initialNominees={nominees}
              directions={directions}
              initialVotedProjectId={userVotedProjectId}
              isAuthenticated={Boolean(userCtx)}
            />
          </div>
        ) : activeWeek ? (
          <EmptyState
            icon={<Vote className="h-7 w-7" />}
            title={`“${activeWeek.title}” haftasi faol, ammo nomzod loyihalar hali biriktirilmagan`}
            description="Loyiha yaratib, Admin paneldagi «Loyihalar» bo‘limida uning holatini «Ovoz berilmoqda» qilib ushbu haftaga biriktiring."
            actionHref={userCtx?.isSuperAdmin ? "/admin" : "/loyihalar/yangi"}
            actionLabel={userCtx?.isSuperAdmin ? "Admin panelda loyiha biriktirish" : "Loyiha yaratish"}
          />
        ) : (
          <EmptyState
            icon={<Vote className="h-7 w-7" />}
            title="Hozirda faol haftalik ovoz berish mavjud emas"
            description="Super Administrator yangi ovoz berish haftasini ochib, moderatsiyadan o‘tgan loyihalarni biriktirgach, ovoz berish avtomatik boshlanadi."
            actionHref={userCtx?.isSuperAdmin ? "/admin" : "/goliblar"}
            actionLabel={userCtx?.isSuperAdmin ? "Admin panelda hafta ochish" : "Oldingi haftalik g‘oliblarni ko‘rish"}
          />
        )}
      </div>
    </div>
  );
}
