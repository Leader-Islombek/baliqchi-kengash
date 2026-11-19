import Link from "next/link";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Compass,
  Flame,
  Heart,
  Layers,
  Megaphone,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/fields";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { DirectionIcon, getDirectionStyle } from "@/components/shared/direction-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/shared/project-card";
import { FadeInSection } from "@/components/features/home/home-motion";
import { PLATFORM_INFO } from "@/lib/constants/official-data";
import {
  getActiveVotingData,
  getAnnouncements,
  getCurrentUserContext,
  getDirections,
  getEvents,
  getPlatformStats,
  getProjects,
  getRecentProjectUpdates,
  getSchoolRankings,
} from "@/lib/data/queries";
import { formatUzDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    userCtx,
    stats,
    directions,
    votingData,
    inProgressProjects,
    completedProjects,
    recentUpdates,
    topRankings,
    announcements,
    events,
  ] = await Promise.all([
    getCurrentUserContext(),
    getPlatformStats(),
    getDirections(),
    getActiveVotingData(),
    getProjects({ status: ["in_progress", "approved"], limit: 3 }),
    getProjects({ status: "completed", limit: 3 }),
    getRecentProjectUpdates(4),
    getSchoolRankings("overall", 6),
    getAnnouncements(3),
    getEvents(3),
  ]);

  const statItems = [
    { label: "Maktablar", value: stats.schoolsCount, icon: School, color: "text-blue-400" },
    { label: "Ro‘yxatdan o‘tgan o‘quvchilar", value: stats.registeredStudentsCount, icon: Users, color: "text-sky-400" },
    { label: "Kengash a’zolari", value: stats.councilMembersCount, icon: ShieldCheck, color: "text-teal-400" },
    { label: "Koordinatorlar", value: stats.coordinatorsCount, icon: Compass, color: "text-indigo-400" },
    { label: "Loyihalar", value: stats.totalProjectsCount, icon: Layers, color: "text-cyan-400" },
    { label: "Amalga oshirilgan", value: stats.completedProjectsCount, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "O‘tkazilgan tadbirlar", value: stats.eventsCount, icon: Calendar, color: "text-amber-400" },
  ];

  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* 1. HERO SECTION */}
      {/* ================================================================ */}
      <section className="bk-hero-bg relative overflow-hidden border-b border-white/10">
        <div className="bk-grid-bg absolute inset-0 opacity-45" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Baliqchi tumani • Andijon viloyati • 61 ta maktab</span>
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
                {PLATFORM_INFO.name}
                <span className="mt-2 block bg-gradient-to-r from-sky-400 via-blue-400 to-teal-300 bg-clip-text text-transparent">
                  {PLATFORM_INFO.slogan}
                </span>
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {PLATFORM_INFO.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/loyihalar">
                  <Button size="lg" variant="primary" className="shadow-lg shadow-blue-600/30">
                    Loyihalarni ko‘rish
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {userCtx ? (
                  <Link href="/kabinet">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      Shaxsiy kabinet
                    </Button>
                  </Link>
                ) : (
                  <Link href="/royxatdan-otish">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      Platformaga qo‘shilish
                    </Button>
                  </Link>
                )}
                <Link href="/ovoz-berish">
                  <Button size="lg" variant="teal">
                    <Vote className="h-4 w-4" />
                    Haftalik ovoz berish
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-slate-400">
                Huquqiy asos:{" "}
                <Link href="/nizom" className="text-sky-300 underline-offset-4 hover:underline">
                  {PLATFORM_INFO.decreeRef}
                </Link>
              </p>
            </div>

            {/* Right Visual Ecosystem Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                      Yagona Raqamli Ekotizim
                    </div>
                    <div className="mt-1 font-display text-lg font-bold text-white">
                      Tashkiliy Tuzilma
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                    Faol tizim
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-xs text-sky-300">Tuman darajasi</div>
                      <div className="text-sm font-semibold text-white">
                        1 Tuman Kelajak Lideri • 7 Tuman Koordinatori
                      </div>
                    </div>
                    <Award className="h-5 w-5 text-sky-400 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-xs text-teal-300">Maktab darajasi</div>
                      <div className="text-sm font-semibold text-white">
                        61 ta Maktab Kengashi • Har birida 8+ a’zo
                      </div>
                    </div>
                    <School className="h-5 w-5 text-teal-400 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-xs text-blue-300">Ovoz berish qoidasi</div>
                      <div className="text-sm font-semibold text-white">
                        Haftasiga 7 yo‘nalish bo‘yicha jami 1 ta adolatli ovoz
                      </div>
                    </div>
                    <Vote className="h-5 w-5 text-blue-400 shrink-0" />
                  </div>
                </div>

                {votingData.activeWeek ? (
                  <div className="mt-5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-sky-200">
                      <span>Faol ovoz berish: {votingData.activeWeek.title}</span>
                      <span>{votingData.totalVotesInWeek} ovoz</span>
                    </div>
                    <CountdownTimer endsAt={votingData.activeWeek.ends_at} />
                  </div>
                ) : (
                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-xs text-slate-300">
                    <span>8 ta boshqaruv guruhi • 7 ta rasmiy klub</span>
                    <Link href="/haqida" className="font-semibold text-sky-300 hover:underline">
                      Tuzilmani ko‘rish →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 2. HAQIQIY STATISTIKALAR (Hech qachon soxta raqam yo'q!) */}
          {/* ================================================================ */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md transition-colors hover:bg-white/[0.09]"
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <div className="mt-2 font-display text-2xl font-bold text-white">
                    <AnimatedCounter value={item.value} />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-300/90 leading-snug">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
          {!stats.isDatabaseConnected && (
            <p className="mt-3 text-xs text-sky-200/75">
              * Haqiqiy ko‘rsatkichlar Supabase bazasi ulangandan so‘ng avtomatik real vaqtda hisoblanadi (demo raqamlar qo‘llanilmaydi).
            </p>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. RASMIY 7 TA YO'NALISH */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-sky-400">
                365-son buyruq Nizomi asosida
              </Badge>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                7 ta rasmiy yo‘nalish
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Har bir maktabda va tuman darajasida alohida koordinator hamda boshqaruv guruhi faoliyat yuritadi.
              </p>
            </div>
            <Link href="/yonalishlar">
              <Button variant="outline" size="sm">
                Barcha yo‘nalishlar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {directions.map((dir) => {
              const st = getDirectionStyle(dir.accent_color);
              return (
                <Link key={dir.id} href={`/yonalishlar/${dir.slug}`} className="group">
                  <Card className="h-full overflow-hidden hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${st.gradient}`} />
                    <CardContent className="p-5">
                      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${st.bg} ${st.text}`}>
                        <DirectionIcon name={dir.icon_name} className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                        {dir.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                        {dir.description}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400">
                        Batafsil
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {/* 8th card: Kelajak Liderlari highlight */}
            <Link href="/kelajak-liderlari" className="group">
              <Card className="h-full overflow-hidden border-blue-500/30 bg-gradient-to-br from-[#0b172e] to-[#132952] text-white hover:-translate-y-1 hover:shadow-xl">
                <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 to-teal-400" />
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-white/10 p-2.5 text-sky-300">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-white">
                    Kelajak Liderlari
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    1 nafar Tuman Kelajak Lideri va 61 nafar Maktab Kelajak Liderlari jamoasi.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-300">
                    Liderlar ro‘yxati
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </FadeInSection>
      </section>

      {/* ================================================================ */}
      {/* 4. HAFTANING ENG YAXSHI LOYIHALARI (OVOZ BERISH VITRINASI) */}
      {/* ================================================================ */}
      <section className="border-y border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#081224] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-2 border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  <Flame className="h-3.5 w-3.5" />
                  Haftalik adolatli ovoz berish
                </Badge>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  Haftaning eng yaxshi loyihalari
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Har bir o‘quvchi haftasiga barcha 7 yo‘nalish bo‘yicha jami 1 ta loyihaga ovoz bera oladi.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/ovoz-berish">
                  <Button variant="primary" size="sm">
                    <Vote className="h-4 w-4" />
                    Ovoz berish sahifasi
                  </Button>
                </Link>
                <Link href="/goliblar">
                  <Button variant="outline" size="sm">
                    G‘oliblar arxivi
                  </Button>
                </Link>
              </div>
            </div>

            {votingData.nominees.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {votingData.nominees.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <EmptyState
                  icon={<Vote className="h-7 w-7" />}
                  title="Joriy haftalik ovoz berish tez orada boshlanadi"
                  description="Moderatsiyadan o‘tgan loyihalar joriy haftaga biriktirilishi bilan bu yerda real vaqtda ko‘rinadi."
                  actionHref="/loyihalar"
                  actionLabel="Barcha loyihalarni ko‘rish"
                />
              </div>
            )}
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. HOZIR AMALGA OSHIRILAYOTGAN ISHLAR (ENG KO'ZGA TASHLANADIGAN BO'LIM) */}
      {/* ================================================================ */}
      <section className="bk-hero-bg relative overflow-hidden py-16 lg:py-20 text-white">
        <div className="bk-grid-bg absolute inset-0 opacity-35" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-2 border-teal-400/30 bg-teal-400/15 text-teal-300">
                  <Rocket className="h-3.5 w-3.5" />
                  Real natija va shaffof monitoring
                </Badge>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Hozir amalga oshirilayotgan ishlar
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm text-slate-300">
                  Tuman darajasida tasdiqlangan loyihalarning bajarilish foizi, bosqichlari va so‘nggi yangilanishlari.
                </p>
              </div>
              <Link href="/amalga-oshirilayotgan">
                <Button variant="teal" size="sm">
                  Barcha monitoringlar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {inProgressProjects.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {inProgressProjects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/loyihalar/${proj.slug}`}
                    className="group rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-md transition-all hover:border-sky-400/50 hover:bg-white/[0.1]"
                  >
                    <div className="flex items-center justify-between text-xs text-sky-300">
                      <span>{proj.direction?.name}</span>
                      <span>
                        {proj.school ? `${proj.school.school_number}-maktab` : "Tuman"}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {proj.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-300 line-clamp-2">{proj.goal}</p>
                    <div className="mt-5">
                      <ProgressBar value={proj.progress_percent} showLabel />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>Yangilangan: {formatUzDate(proj.updated_at)}</span>
                      <span className="font-semibold text-teal-300">Jarayonni ko‘rish →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.05] p-8 text-center backdrop-blur-md">
                <Rocket className="mx-auto h-9 w-9 text-sky-300" />
                <h3 className="mt-3 font-display text-lg font-semibold text-white">
                  Amalga oshirilayotgan loyihalar monitoringi tayyor
                </h3>
                <p className="mx-auto mt-1.5 max-w-xl text-sm text-slate-300">
                  Haftalik g‘olib deb topilgan va tuman darajasida tasdiqlangan loyihalar bu yerda bajarilish foizi hamda foto-hisobotlari bilan aks ettiriladi.
                </p>
              </div>
            )}

            {recentUpdates.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                {recentUpdates.map((upd) => (
                  <div
                    key={upd.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-teal-300">
                        {upd.project?.title || "Loyiha yangilanishi"} • {upd.progress_percent}%
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-white truncate">
                        {upd.title}
                      </div>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">{upd.content}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatUzDate(upd.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. FAOL MAKTABLAR REYTINGI (61 TA MAKTAB) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Ko‘p mezonli shaffof baholash
              </Badge>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Faol maktablar reytingi
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Reyting amalga oshirilgan loyihalar, tadbirlar, hisobotlar va yo‘nalishlar faolligiga asoslanadi.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/reyting">
                <Button variant="primary" size="sm">
                  To‘liq reyting
                </Button>
              </Link>
              <Link href="/maktablar">
                <Button variant="outline" size="sm">
                  61 ta maktab
                </Button>
              </Link>
            </div>
          </div>

          {topRankings.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {topRankings.slice(0, 3).map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/maktablar/${item.school?.slug || item.school_id}`}
                >
                  <Card className="p-6 hover:border-blue-500/40 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 font-display text-lg font-bold text-white">
                        #{item.rank_position || idx + 1}
                      </span>
                      <span className="font-display text-2xl font-extrabold text-blue-600 dark:text-sky-400">
                        {item.total_score} ball
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {item.school?.name || "Maktab"}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Yakunlangan: {item.metrics_breakdown?.completed_projects || 0}</span>
                      <span>•</span>
                      <span>Tadbirlar: {item.metrics_breakdown?.events_count || 0}</span>
                      <span>•</span>
                      <span>Hisobotlar: {item.metrics_breakdown?.reports_count || 0}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={<Trophy className="h-7 w-7" />}
                title="61 ta maktab reytingi faoliyat boshlanishi bilan hisoblanadi"
                description="Maktablar loyihalar, tadbirlar va hisobotlarni kiritishi bilan reyting avtomatik va shaffof shakllanadi."
                actionHref="/maktablar"
                actionLabel="61 ta maktab ro‘yxatini ko‘rish"
              />
            </div>
          )}
        </FadeInSection>
      </section>

      {/* ================================================================ */}
      {/* 7. YANGILIKLAR VA TADBIRLAR */}
      {/* ================================================================ */}
      <section className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#081224] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* Yangiliklar */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="h-5 w-5 text-blue-600 dark:text-sky-400" />
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      So‘nggi yangiliklar
                    </h2>
                  </div>
                  <Link href="/yangiliklar" className="text-sm font-semibold text-blue-600 dark:text-sky-400 hover:underline">
                    Barchasi →
                  </Link>
                </div>

                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((item) => (
                      <Link key={item.id} href={`/yangiliklar/${item.slug}`} className="block">
                        <Card className="p-5 hover:border-blue-500/40">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatUzDate(item.published_at)}
                            {item.school ? ` • ${item.school.school_number}-maktab` : " • Tuman miqyosida"}
                          </div>
                          <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {item.excerpt}
                            </p>
                          )}
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Megaphone className="h-6 w-6" />}
                    title="Hozircha yangiliklar joylanmagan"
                    description="Tuman va maktab Kelajak Liderlari yangilik va e’lonlarni joylaganda shu yerda aks etadi."
                    actionHref="/yangiliklar"
                    actionLabel="Yangiliklar bo‘limi"
                  />
                )}
              </div>

              {/* Tadbirlar */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      Tadbirlar
                    </h2>
                  </div>
                  <Link href="/tadbirlar" className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                    Barchasi →
                  </Link>
                </div>

                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((ev) => (
                      <Link key={ev.id} href={`/tadbirlar/${ev.slug}`} className="block">
                        <Card className="p-5 hover:border-teal-500/40">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatUzDate(ev.starts_at, true)}</span>
                            <span className="font-medium text-teal-600 dark:text-teal-400">
                              {ev.location}
                            </span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </h3>
                          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {ev.description}
                          </p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Calendar className="h-6 w-6" />}
                    title="Rejalashtirilgan tadbirlar kutilmoqda"
                    description="61 ta maktab va tuman miqyosidagi tadbirlar taqvimi shu bo‘limda ko‘rinadi."
                    actionHref="/tadbirlar"
                    actionLabel="Tadbirlar sahifasi"
                  />
                )}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 8. MUVAFFAQIYATLI YAKUNLANGAN LOYIHALAR */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Haqiqiy natijalar
              </Badge>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Muvaffaqiyatli yakunlangan loyihalar
              </h2>
            </div>
            <Link href="/amalga-oshirilayotgan">
              <Button variant="outline" size="sm">
                Barcha natijalar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {completedProjects.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 p-8 sm:p-10 text-white shadow-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <h3 className="font-display text-2xl font-bold">
                    Birinchi tarixiy loyiha muallifi bo‘ling!
                  </h3>
                  <p className="mt-2 text-sm text-blue-100 sm:text-base">
                    61 ta maktabdan o‘quvchilar va koordinatorlar o‘z tashabbuslarini ilgari surib,
                    haftalik ovoz berishda g‘olib bo‘lishi hamda haqiqiy o‘zgarishlar yaratishi mumkin.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/royxatdan-otish">
                    <Button size="lg" variant="secondary">
                      Ro‘yxatdan o‘tish
                    </Button>
                  </Link>
                  <Link href="/nizom">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Heart className="h-4 w-4" />
                      Nizom bilan tanishish
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </FadeInSection>
      </section>
    </div>
  );
}
