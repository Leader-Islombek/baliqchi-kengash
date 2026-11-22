import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  Flame,
  Megaphone,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { ProgressBar } from "@/core/ui/primitives/fields";
import { CountdownTimer } from "@/core/ui/shared/countdown-timer";
import { DirectionIcon, getDirectionStyle } from "@/core/ui/shared/direction-icon";
import { EmptyState } from "@/core/ui/shared/empty-state";
import { ProjectCard } from "@/modules/projects/components/project-card";
import { VoteButton } from "@/modules/voting/components/vote-button";
import { Reveal, StaggerGrid, StaggerItem } from "@/core/ui/shared/motion-primitives";
import { Perspective3DGrid, Tilt3DCard } from "@/core/ui/shared/scene-3d";
import { HeroSection } from "@/modules/home/components/hero-section";
import { SchoolsPreview } from "@/modules/home/components/schools-preview";
import { PLATFORM_INFO } from "@/core/config/official-data";
import {
  getActiveVotingData,
  getAnnouncements,
  getCoordinators,
  getCurrentUserContext,
  getDirections,
  getEvents,
  getPlatformStats,
  getProjects,
  getRecentProjectUpdates,
  getSchoolRankings,
  getSchools,
} from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userCtx = await getCurrentUserContext();

  const [
    stats,
    directions,
    schools,
    votingData,
    featuredProjects,
    inProgressProjects,
    recentUpdates,
    coordinators,
    topRankings,
    announcements,
    events,
  ] = await Promise.all([
    getPlatformStats(),
    getDirections(),
    getSchools(),
    getActiveVotingData(userCtx?.user.id),
    getProjects({ limit: 6 }),
    getProjects({ status: ["in_progress", "approved"], limit: 3 }),
    getRecentProjectUpdates(4),
    getCoordinators(),
    getSchoolRankings("overall", 6),
    getAnnouncements(3),
    getEvents(3),
  ]);

  const districtLeader = coordinators.find((c) => c.role === "district_leader");
  const schoolLeaders = coordinators.filter((c) => c.role === "school_leader");
  const districtCoords = coordinators.filter((c) => c.role === "district_coordinator");

  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* 1 & 2 & 3. HERO SECTION + ANIMATED REAL STATISTICS */}
      {/* ================================================================ */}
      <HeroSection
        stats={stats}
        activeWeek={votingData.activeWeek}
        totalVotesInWeek={votingData.totalVotesInWeek}
        isAuthenticated={Boolean(userCtx)}
      />

      {/* ================================================================ */}
      {/* 4. KENGASH HAQIDA (ABOUT THE COUNCIL) */}
      {/* ================================================================ */}
      <section
        id="kengash-haqida"
        className="scroll-mt-16 bg-white dark:bg-[#0B1224] py-16 lg:py-22 border-b border-[#DCE5F5] dark:border-[#22345A]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge className="border-[#2563EB]/25 bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]">
                  <BookOpen className="h-3.5 w-3.5" />
                  Kengash haqida
                </Badge>
                <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl leading-tight">
                  61 ta maktab yoshlarining yagona tashabbus platformasi
                </h2>
                <p className="text-base leading-relaxed text-[#64748B] dark:text-slate-300">
                  Platforma {PLATFORM_INFO.decreeRef} asosida faoliyat yuritib, “Tengdosh-tengdoshga”
                  tamoyili orqali har bir o‘quvchining g‘oyasini real loyihaga aylantirish uchun
                  yaratilgan.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/haqida">
                    <Button variant="primary" size="md">
                      Batafsil tanishish
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/nizom">
                    <Button variant="outline" size="md">
                      Rasmiy Nizom (10 bob)
                    </Button>
                  </Link>
                </div>
              </div>

              <StaggerGrid className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Building2,
                    color: "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]",
                    title: "Ikki darajali tizim",
                    desc: "Tuman Kengashi (1 lider + 7 koordinator) va 61 ta maktabning mustaqil profillari.",
                  },
                  {
                    icon: Vote,
                    color: "bg-[#10B981]/10 text-[#10B981]",
                    title: "Shaffof ovoz berish",
                    desc: "Har bir o‘quvchi haftasiga barcha 7 yo‘nalish bo‘yicha 1 ta adolatli ovoz beradi.",
                  },
                  {
                    icon: ShieldCheck,
                    color: "bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8]",
                    title: "Real monitoring",
                    desc: "G‘olib loyihalar tuman darajasida ko‘rib chiqilib, bajarilish foizi ochiq kuzatiladi.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <StaggerItem key={item.title}>
                      <Card className="h-full p-6 rounded-3xl hover:-translate-y-1 hover:border-[#3B82F6]/40 hover:shadow-lg">
                        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-display text-base font-bold text-[#172033] dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#64748B] dark:text-slate-400">
                          {item.desc}
                        </p>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </StaggerGrid>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. YANGILIKLAR VA TADBIRLAR TAQVIMI (TEPAROQQA OLIB CHIQILDI) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5] dark:text-[#22D3EE]">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-[#111827] dark:text-white">
                    So‘nggi yangiliklar
                  </h2>
                </div>
                <Link href="/yangiliklar" className="text-sm font-bold text-[#4F46E5] dark:text-[#22D3EE] hover:underline">
                  Barchasi →
                </Link>
              </div>

              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((item) => (
                    <Link key={item.id} href={`/yangiliklar/${item.slug}`} className="block group">
                      <Card className="p-5 rounded-2xl hover:border-[#4F46E5]/50 hover:-translate-y-0.5">
                        <div className="text-xs font-medium text-[#5B677F]">
                          {formatUzDate(item.published_at)} •{" "}
                          {item.school ? `${item.school.school_number}-maktab` : "Tuman miqyosida"}
                        </div>
                        <h3 className="mt-1.5 font-display text-base font-bold text-[#111827] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-[#22D3EE] transition-colors">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="mt-1.5 text-sm text-[#5B677F] dark:text-slate-400 line-clamp-2">
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
                  title="Hozircha yangiliklar e’lon qilinmagan"
                  description="Tuman va maktab Kelajak Liderlari yangilik joylashi bilan shu yerda aks etadi."
                  actionHref="/yangiliklar"
                  actionLabel="Yangiliklar bo‘limi"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10B981]/10 text-[#10B981]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-[#111827] dark:text-white">
                    Tadbirlar taqvimi
                  </h2>
                </div>
                <Link href="/tadbirlar" className="text-sm font-bold text-[#10B981] hover:underline">
                  Barchasi →
                </Link>
              </div>

              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((ev) => (
                    <Link key={ev.id} href={`/tadbirlar/${ev.slug}`} className="block group">
                      <Card className="p-5 rounded-2xl hover:border-[#10B981]/50 hover:-translate-y-0.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#5B677F]">
                          <span>{formatUzDate(ev.starts_at, true)}</span>
                          <span className="font-semibold text-[#10B981] truncate">{ev.location}</span>
                        </div>
                        <h3 className="mt-1.5 font-display text-base font-bold text-[#111827] dark:text-white group-hover:text-[#10B981] transition-colors">
                          {ev.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#5B677F] dark:text-slate-400 line-clamp-2">
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
                  description="61 ta maktab va tuman miqyosidagi tadbirlar shu bo‘limda ko‘rinadi."
                  actionHref="/tadbirlar"
                  actionLabel="Tadbirlar sahifasi"
                />
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================================================================ */}
      {/* 6. 7 TA FAOLIYAT YO'NALISHI (FAQAT RASMIY 7 TA YO'NALISH) */}
      {/* ================================================================ */}
      <section className="bg-white dark:bg-[#0D162B] border-y border-[#DCE5F5] dark:border-[#22345A] py-16 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-2 border-[#4F46E5]/25 bg-[#4F46E5]/10 text-[#4F46E5] dark:text-[#22D3EE]">
                  365-son buyruq Nizomi asosida
                </Badge>
                <h2 className="font-display text-3xl font-extrabold text-[#111827] dark:text-white sm:text-4xl">
                  7 ta faoliyat yo‘nalishi
                </h2>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#5B677F] dark:text-slate-400">
                  Har bir yo‘nalishda tuman koordinatori va 61 ta maktab koordinatorlari jamoaviy ishlaydi.
                </p>
              </div>
              <Link href="/yonalishlar">
                <Button variant="outline" size="sm">
                  Barcha yo‘nalishlar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <StaggerGrid className="mt-9 flex flex-wrap justify-center gap-4">
            {directions.map((dir) => {
              const st = getDirectionStyle(dir.accent_color);
              return (
                <StaggerItem
                  key={dir.id}
                  className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                >
                  <Tilt3DCard glowColor="rgba(79, 70, 229, 0.16)" maxTilt={6}>
                    <Link href={`/yonalishlar/${dir.slug}`} className="group block h-full">
                      <Card className="h-full overflow-hidden rounded-3xl hover:border-[#4F46E5]/50 hover:shadow-xl hover:shadow-[#4F46E5]/15">
                        <div className={`h-1.5 w-full bg-gradient-to-r ${st.gradient}`} />
                        <CardContent className="p-5 flex flex-col h-full">
                          <div className={`mb-3.5 inline-flex w-fit rounded-2xl p-3 ${st.bg} ${st.text} transition-transform duration-200 group-hover:scale-110`}>
                            <DirectionIcon name={dir.icon_name} className="h-5 w-5" />
                          </div>
                          <h3 className="font-display text-base font-bold text-[#111827] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-[#22D3EE] transition-colors">
                            {dir.name}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-[#5B677F] dark:text-slate-400 line-clamp-3 flex-1">
                            {dir.description}
                          </p>
                          <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] dark:text-[#22D3EE]">
                            Batafsil
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </Tilt3DCard>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 7. SARALANGAN LOYIHALAR (FEATURED PROJECTS) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <div>
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="mb-2 border-[#10B981]/30 bg-[#10B981]/10 text-[#059669] dark:text-[#34D399]">
                  <Rocket className="h-3.5 w-3.5" />
                  O‘quvchilar tashabbuslari
                </Badge>
                <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl">
                  Saralangan loyihalar
                </h2>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#64748B] dark:text-slate-400">
                  61 ta maktabdan yuborilgan va moderatsiyadan o‘tgan eng dolzarb g‘oyalar hamda amalga oshirilayotgan loyihalar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/loyihalar">
                  <Button variant="primary" size="sm">
                    Barcha loyihalar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/amalga-oshirilayotgan">
                  <Button variant="outline" size="sm">
                    Monitoring
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>

          {featuredProjects.length > 0 ? (
            <StaggerGrid className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.slice(0, 6).map((project) => (
                <StaggerItem key={project.id}>
                  <ProjectCard project={project} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <div className="mt-9">
              <EmptyState
                icon={<Rocket className="h-7 w-7" />}
                title="Hozircha ommaviy loyihalar e’lon qilinmagan"
                description="Koordinatorlar va Kelajak Liderlari yangi loyiha joylab, moderatsiyadan o‘tkazishi bilan shu yerda aks etadi."
                actionHref="/loyihalar/yangi"
                actionLabel="Yangi loyiha yaratish"
              />
            </div>
          )}

          {/* Jarayondagi loyihalardan tezkor monitoring lentasi */}
          {inProgressProjects.length > 0 && (
            <Reveal delay={0.1} className="mt-10">
              <div className="rounded-3xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#111C35] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-display text-lg font-bold text-[#172033] dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                    Hozir amalga oshirilayotgan ishlar
                  </h3>
                  <Link href="/amalga-oshirilayotgan" className="text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline">
                    Barcha jarayonlar →
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {inProgressProjects.map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/loyihalar/${proj.slug}`}
                      className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#0B1224] p-4 hover:border-[#3B82F6]/50 transition-colors"
                    >
                      <div className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                        {proj.direction?.name} • {proj.school ? `${proj.school.school_number}-maktab` : "Tuman"}
                      </div>
                      <div className="mt-1 font-display text-sm font-bold text-[#172033] dark:text-white line-clamp-1">
                        {proj.title}
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={proj.progress_percent} showLabel />
                      </div>
                    </Link>
                  ))}
                </div>
                {recentUpdates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#DCE5F5] dark:border-[#22345A] grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recentUpdates.slice(0, 2).map((u) => (
                      <div key={u.id} className="text-xs text-[#64748B] dark:text-slate-300 flex items-center justify-between gap-2">
                        <span className="truncate">
                          <strong className="text-[#10B981]">{u.progress_percent}%</strong> — {u.project?.title}: {u.title}
                        </span>
                        <span className="shrink-0 text-[11px]">{formatUzDate(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 7. HAFTALIK OVOZ BERISH BO'LIMI (DARK BAND) */}
      {/* ================================================================ */}
      <section className="bk-dark-band relative overflow-hidden py-16 lg:py-22 text-white">
        <div className="bk-grid-bg absolute inset-0 opacity-30" />
        <Perspective3DGrid />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge className="mb-3 border-[#38BDF8]/35 bg-[#38BDF8]/15 text-[#38BDF8]">
                  <Flame className="h-3.5 w-3.5" />
                  Haftalik adolatli ovoz berish
                </Badge>
                <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                  Eng yaxshi loyihani birgalikda tanlang
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-300">
                  Har bir o‘quvchi haftasiga barcha 7 ta yo‘nalish bo‘yicha{" "}
                  <strong className="text-white">jami 1 ta ovoz</strong> bera oladi. Natijalar server tomonida atomar himoyalanadi.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {votingData.activeWeek && <CountdownTimer endsAt={votingData.activeWeek.ends_at} />}
                <Link href="/ovoz-berish">
                  <Button variant="teal" size="md">
                    <Vote className="h-4 w-4" />
                    Ovoz berish markazi
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>

          {votingData.activeWeek && votingData.nominees.length > 0 ? (
            <StaggerGrid className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {votingData.nominees.slice(0, 3).map((proj, idx) => {
                const share =
                  votingData.totalVotesInWeek > 0
                    ? Math.round((proj.votes_count / votingData.totalVotesInWeek) * 100)
                    : 0;
                return (
                  <StaggerItem key={proj.id}>
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-white/15 bg-[#111C35]/85 p-6 backdrop-blur-md transition-all hover:border-[#38BDF8]/50">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[#38BDF8]">
                            #{idx + 1} • {proj.direction?.name}
                          </span>
                          <span className="text-slate-400">
                            {proj.school ? `${proj.school.school_number}-maktab` : "Tuman"}
                          </span>
                        </div>
                        <Link
                          href={`/loyihalar/${proj.slug}`}
                          className="mt-2.5 block font-display text-lg font-bold text-white hover:text-[#38BDF8] transition-colors line-clamp-2"
                        >
                          {proj.title}
                        </Link>
                        <p className="mt-2 text-xs text-slate-300 line-clamp-2">{proj.goal}</p>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-white">{proj.votes_count} ta ovoz</span>
                            <span className="text-[#38BDF8] font-semibold">{share}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#10B981]"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <Link
                          href={`/loyihalar/${proj.slug}`}
                          className="text-xs font-semibold text-slate-300 hover:text-[#38BDF8]"
                        >
                          Tafsilot →
                        </Link>
                        <VoteButton
                          projectId={proj.id}
                          projectTitle={proj.title}
                          directionName={proj.direction?.name}
                          schoolName={proj.school ? `${proj.school.school_number}-maktab` : "Baliqchi tumani"}
                          initialVotes={proj.votes_count}
                          userVotedProjectId={votingData.userVotedProjectId}
                          isAuthenticated={Boolean(userCtx)}
                        />
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          ) : (
            <div className="mt-9 rounded-3xl border border-white/15 bg-[#111C35]/70 p-8 text-center">
              <Vote className="mx-auto h-9 w-9 text-[#38BDF8]" />
              <h3 className="mt-3 font-display text-lg font-bold text-white">
                {votingData.activeWeek
                  ? `“${votingData.activeWeek.title}” haftasi faol — nomzod loyihalar kutilmoqda`
                  : "Navbatdagi haftalik ovoz berish tayyorlanmoqda"}
              </h3>
              <p className="mx-auto mt-1.5 max-w-xl text-sm text-slate-300">
                Moderatsiyadan o‘tgan loyihalar joriy haftaga biriktirilishi bilan bu yerda jonli ovoz berish ochiladi.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/ovoz-berish">
                  <Button variant="primary" size="sm">Ovoz berish sahifasi</Button>
                </Link>
                <Link href="/goliblar">
                  <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    G‘oliblar arxivi
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 8. KELAJAK LIDERLARI BO'LIMI (FUTURE LEADERS) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-[#2563EB]/25 bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]">
                <Award className="h-3.5 w-3.5" />
                1 Tuman Lideri + 61 Maktab Lideri
              </Badge>
              <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl">
                Kelajak Liderlari
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#64748B] dark:text-slate-400">
                Har bir maktabning O‘quvchilar Kengashiga rahbarlik qiluvchi va o‘quvchilar ovozini tuman darajasiga olib chiquvchi yetakchilar.
              </p>
            </div>
            <Link href="/kelajak-liderlari">
              <Button variant="outline" size="sm">
                Barcha liderlar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Card className="h-full rounded-3xl border-[#2563EB]/30 bg-gradient-to-br from-[#0B1224] to-[#13254D] p-7 text-white flex flex-col justify-between">
              <div>
                <Badge className="border-[#38BDF8]/40 bg-[#38BDF8]/15 text-[#38BDF8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tuman Kelajak Lideri
                </Badge>
                <h3 className="mt-4 font-display text-2xl font-extrabold">
                  {districtLeader?.user
                    ? `${districtLeader.user.first_name} ${districtLeader.user.last_name}`
                    : "Tuman Kelajak Lideri tayinlanmoqda"}
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  61 nafar Maktab Kelajak Lideri va 7 nafar Tuman koordinatori faoliyatini muvofiqlashtiradi, haftalik g‘olib loyihalarni ko‘rib chiqadi.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-[#38BDF8]">
                <span>Tasdiqlangan maktab liderlari: {schoolLeaders.length} / 61</span>
                <Link href="/kelajak-liderlari" className="font-bold hover:underline">
                  To‘liq tarkib →
                </Link>
              </div>
            </Card>
          </Reveal>

          <div className="lg:col-span-7">
            {schoolLeaders.length > 0 ? (
              <StaggerGrid className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {schoolLeaders.slice(0, 6).map((sl) => (
                  <StaggerItem key={sl.id}>
                    <Link href={sl.school ? `/maktablar/${sl.school.slug}` : "/kelajak-liderlari"}>
                      <Card className="p-4 rounded-2xl flex items-center gap-3.5 hover:border-[#3B82F6]/50 hover:-translate-y-0.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB]/10 font-display text-sm font-extrabold text-[#2563EB] dark:text-[#38BDF8]">
                          {sl.school?.school_number || "L"}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-display text-sm font-bold text-[#172033] dark:text-white">
                            {sl.user?.first_name} {sl.user?.last_name}
                          </div>
                          <div className="truncate text-xs text-[#64748B] dark:text-slate-400">
                            {sl.school?.name || "Maktab Kelajak Lideri"}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            ) : (
              <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="61 ta maktab Kelajak Liderlari shakllantirilmoqda"
                description="Maktab Kelajak Liderlari ro‘yxatdan o‘tib Super Administrator tomonidan tasdiqlangach bu yerda ko‘rinadi."
                actionHref="/royxatdan-otish"
                actionLabel="Lider sifatida qo‘shilish"
              />
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 9. 61 TA MAKTAB KATALOGI PREVIEW (SCHOOL DIRECTORY PREVIEW) */}
      {/* ================================================================ */}
      <section className="bg-white dark:bg-[#0D162B] border-y border-[#DCE5F5] dark:border-[#22345A] py-16 lg:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8">
              <Badge className="mb-2 border-[#10B981]/30 bg-[#10B981]/10 text-[#059669] dark:text-[#34D399]">
                <School className="h-3.5 w-3.5" />
                Baliqchi tumani • 61 ta maktab
              </Badge>
              <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl">
                O‘z maktabingiz profilini toping
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#64748B] dark:text-slate-400">
                Har bir maktabning mustaqil sahifasi: Kelajak Lideri, 7 ta koordinator, sinf vakillari, klublar va loyihalar.
              </p>
            </div>
            <SchoolsPreview schools={schools} />
          </Reveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 10. KOORDINATORLAR BO'LIMI (COORDINATORS SECTION) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-[#38BDF8]/35 bg-[#38BDF8]/10 text-[#0284C7] dark:text-[#38BDF8]">
                <Compass className="h-3.5 w-3.5" />
                7 ta yo‘nalish boshqaruvi
              </Badge>
              <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl">
                Tuman yo‘nalish koordinatorlari
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#64748B] dark:text-slate-400">
                Har bir tuman koordinatori o‘z yo‘nalishidagi 61 ta maktab koordinatorlari jamoasini va guruhini boshqaradi.
              </p>
            </div>
            <Link href="/koordinatorlar">
              <Button variant="outline" size="sm">
                Barcha koordinatorlar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>

        <StaggerGrid className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {directions.map((dir) => {
            const assigned = districtCoords.find((c) => c.direction?.slug === dir.slug);
            const st = getDirectionStyle(dir.accent_color);
            return (
              <StaggerItem key={dir.id}>
                <Card className="p-5 rounded-2xl h-full hover:border-[#3B82F6]/40">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${st.bg} ${st.text}`}>
                      <DirectionIcon name={dir.icon_name} className="h-3.5 w-3.5" />
                      {dir.short_name}
                    </span>
                    <ShieldCheck className={`h-4 w-4 ${assigned ? "text-[#10B981]" : "text-slate-300 dark:text-slate-700"}`} />
                  </div>
                  <div className="mt-3.5 font-display text-base font-bold text-[#172033] dark:text-white">
                    {assigned?.user
                      ? `${assigned.user.first_name} ${assigned.user.last_name}`
                      : "Tayinlanishi kutilmoqda"}
                  </div>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                    Tuman {dir.name.toLowerCase()} koordinatori
                  </p>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </section>

      {/* ================================================================ */}
      {/* 12. FAOL MAKTABLAR REYTINGI (SCHOOL ACTIVITY RANKING) */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-2 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Ko‘p mezonli shaffof baholash
              </Badge>
              <h2 className="font-display text-3xl font-extrabold text-[#172033] dark:text-white sm:text-4xl">
                Faol maktablar reytingi
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#64748B] dark:text-slate-400">
                Amalga oshirilgan loyihalar, tadbirlar, hisobotlar va yo‘nalishlar faolligi bo‘yicha 61 ta maktab natijalari.
              </p>
            </div>
            <Link href="/reyting">
              <Button variant="primary" size="sm">
                To‘liq reyting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>

        {topRankings.length > 0 ? (
          <StaggerGrid className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
            {topRankings.slice(0, 3).map((item, idx) => (
              <StaggerItem key={item.id}>
                <Link href={`/maktablar/${item.school?.slug || item.school_id}`}>
                  <Card className="h-full rounded-3xl p-6 hover:-translate-y-1 hover:border-[#3B82F6]/50 hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] font-display text-lg font-extrabold text-white shadow-md">
                        #{item.rank_position || idx + 1}
                      </span>
                      <span className="font-display text-2xl font-extrabold text-[#2563EB] dark:text-[#38BDF8]">
                        {item.total_score} ball
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-[#172033] dark:text-white">
                      {item.school?.name || "Maktab"}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64748B] dark:text-slate-400">
                      <span>Yakunlangan: {item.metrics_breakdown?.completed_projects || 0}</span>
                      <span>•</span>
                      <span>Tadbirlar: {item.metrics_breakdown?.events_count || 0}</span>
                      <span>•</span>
                      <span>Hisobotlar: {item.metrics_breakdown?.reports_count || 0}</span>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <div className="mt-9">
            <EmptyState
              icon={<Trophy className="h-7 w-7" />}
              title="61 ta maktab reytingi faoliyat boshlanishi bilan shakllanadi"
              description="Loyihalar, tadbirlar va hisobotlar kiritilgach reyting ko‘p mezonli formula asosida avtomatik hisoblanadi."
              actionHref="/reyting"
              actionLabel="Reyting mezonlarini ko‘rish"
            />
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* 13. CALL-TO-ACTION SECTION */}
      {/* ================================================================ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="bk-hero-bg relative overflow-hidden rounded-[28px] border border-white/15 p-8 sm:p-12 lg:p-14 text-white shadow-2xl">
            <div className="bk-grid-bg absolute inset-0 opacity-30" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge className="border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]">
                  Baliqchi tumani yoshlar harakati
                </Badge>
                <h2 className="font-display text-3xl font-extrabold sm:text-4xl leading-tight">
                  O‘z g‘oyangiz bilan tumaningiz rivojiga hissa qo‘shing
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  61 ta maktab o‘quvchilari safiga qo‘shiling, haftalik ovoz berishda ishtirok eting
                  va eng yaxshi tashabbuslarni hayotga tatbiq eting.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link href={userCtx ? "/kabinet" : "/royxatdan-otish"}>
                  <Button size="lg" variant="primary" className="shadow-lg shadow-[#2563EB]/35">
                    {userCtx ? "Shaxsiy kabinet" : "Hoziroq qo‘shilish"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/ovoz-berish">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Vote className="h-4 w-4" />
                    Ovoz berish
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
