import Link from "next/link";
import { CheckCircle2, Info, Lock, ShieldCheck, Vote } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { DirectionIcon, getDirectionStyle } from "@/components/shared/direction-icon";
import { VoteButton } from "@/components/shared/vote-button";
import { getActiveVotingData, getCurrentUserContext } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Haftalik ovoz berish",
};

export default async function WeeklyVotingPage() {
  const userCtx = await getCurrentUserContext();
  const { activeWeek, nominees, userVotedProjectId, totalVotesInWeek } =
    await getActiveVotingData(userCtx?.user.id);

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
        {/* Qoidalar va foydalanuvchi holati banneri */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 border-blue-500/25 bg-blue-500/5 lg:col-span-2">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm">
                <div className="font-display font-bold text-slate-900 dark:text-white">
                  Server tomonida atomar himoyalangan ovoz berish
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Bir foydalanuvchi bir haftada istalgan bitta yo‘nalishdagi faqat bitta loyihaga ovoz bera oladi.
                  Takroriy ovozlar server va ma’lumotlar bazasi darajasida bloklanadi. Haftalik g‘olib loyiha
                  avtomatik tasdiqlanmaydi — avval Tuman Kelajak Lideri va tegishli tuman koordinatori tomonidan ko‘rib chiqiladi.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-center">
            {!userCtx ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Lock className="h-4 w-4 text-amber-500" />
                  Ovoz berish uchun kiring
                </div>
                <div className="flex gap-2">
                  <Link href="/kirish" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Kirish
                    </Button>
                  </Link>
                  <Link href="/royxatdan-otish" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Ro‘yxatdan o‘tish
                    </Button>
                  </Link>
                </div>
              </div>
            ) : userVotedProjectId ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Joriy haftadagi ovozingiz berildi
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keyingi haftalik ovoz berish ochilganda yangi loyihaga ovoz berishingiz mumkin.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-sky-400">
                  <Vote className="h-5 w-5" />
                  Sizda 1 ta faol ovoz mavjud!
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Eng munosib deb bilgan bitta loyihani tanlab qo‘llab-quvvatlang.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Nomzodlar */}
        {activeWeek && nominees.length > 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {activeWeek.title} — Nomzod loyihalar ({nominees.length})
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Jami qabul qilingan haqiqiy ovozlar: <strong>{totalVotesInWeek}</strong>
                </p>
              </div>
              <Link href="/goliblar">
                <Button variant="outline" size="sm">Haftalik g‘oliblar arxivi</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {nominees.map((proj, index) => {
                const st = getDirectionStyle(proj.direction?.accent_color);
                const share =
                  totalVotesInWeek > 0
                    ? Math.round((proj.votes_count / totalVotesInWeek) * 100)
                    : 0;

                return (
                  <Card
                    key={proj.id}
                    className={`overflow-hidden ${
                      index === 0 ? "border-blue-500/50 ring-1 ring-blue-500/20" : ""
                    }`}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-display text-xs font-bold">
                            #{index + 1}
                          </span>
                          <Badge className={`${st.bg} ${st.text} ${st.border}`}>
                            <DirectionIcon name={proj.direction?.icon_name} className="h-3.5 w-3.5" />
                            {proj.direction?.name}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {proj.school ? `${proj.school.school_number}-maktab` : "Tuman"}
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/loyihalar/${proj.slug}`}
                          className="font-display text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-sky-400"
                        >
                          {proj.title}
                        </Link>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {proj.goal}
                        </p>
                      </div>

                      {/* Shaffof ovoz ulushi */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {proj.votes_count} ta ovoz
                          </span>
                          <span className="text-slate-500">{share}% ulush</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-400"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/loyihalar/${proj.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                        >
                          <Info className="h-3.5 w-3.5" />
                          Loyihani to‘liq o‘qish
                        </Link>
                        <VoteButton
                          projectId={proj.id}
                          initialVotes={proj.votes_count}
                          userVotedProjectId={userVotedProjectId}
                          isAuthenticated={Boolean(userCtx)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : activeWeek ? (
          <EmptyState
            icon={<Vote className="h-7 w-7" />}
            title={`"${activeWeek.title}" haftasi faol, ammo nomzod loyihalar hali biriktirilmagan`}
            description="Loyiha yaratib, Admin paneldagi «Loyihalar» bo‘limida uning holatini «Ovoz berilmoqda» qilib ushbu haftaga biriktiring — shundan so‘ng ovoz berish tugmasi darhol paydo bo‘ladi."
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
