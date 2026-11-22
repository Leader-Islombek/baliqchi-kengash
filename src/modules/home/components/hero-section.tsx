"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Compass,
  Layers,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { AnimatedCounter } from "@/core/ui/shared/animated-counter";
import { CountdownTimer } from "@/core/ui/shared/countdown-timer";
import {
  District3DConstellation,
  Perspective3DGrid,
  Tilt3DCard,
} from "@/core/ui/shared/scene-3d";
import { PLATFORM_INFO } from "@/core/config/official-data";
import type { PlatformStats, VotingWeek } from "@/core/types/database";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({
  stats,
  activeWeek,
  totalVotesInWeek,
  isAuthenticated,
}: {
  stats: PlatformStats;
  activeWeek: VotingWeek | null;
  totalVotesInWeek: number;
  isAuthenticated: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const statItems = [
    { label: "Maktablar", value: stats.schoolsCount, icon: School, color: "text-[#22D3EE]" },
    { label: "O‘quvchilar", value: stats.registeredStudentsCount, icon: Users, color: "text-[#818CF8]" },
    { label: "Kengash a’zolari", value: stats.councilMembersCount, icon: ShieldCheck, color: "text-[#34D399]" },
    { label: "Koordinatorlar", value: stats.coordinatorsCount, icon: Compass, color: "text-[#A78BFA]" },
    { label: "Loyihalar", value: stats.totalProjectsCount, icon: Layers, color: "text-[#38BDF8]" },
    { label: "Amalga oshirilgan", value: stats.completedProjectsCount, icon: CheckCircle2, color: "text-[#10B981]" },
    { label: "Tadbirlar", value: stats.eventsCount, icon: Calendar, color: "text-[#FBBF24]" },
  ];

  return (
    <section
      ref={ref}
      className="bk-hero-bg relative overflow-hidden border-b border-white/10"
    >
      {/* 3D Horizon Grid Floor + Parallax Aurora Orbs */}
      <div className="bk-grid-bg absolute inset-0 opacity-35" />
      <Perspective3DGrid />
      <motion.div
        style={{ y: orbY }}
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-96 w-96 rounded-full bg-[#4F46E5]/30 blur-[100px]"
      />
      <motion.div
        style={{ y: orbY }}
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full bg-[#22D3EE]/22 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-[110px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left Headline Column */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/35 bg-[#0E1733]/85 px-4 py-1.5 text-xs font-semibold text-[#22D3EE] shadow-lg shadow-[#22D3EE]/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
              <span>Baliqchi tumani O‘quvchilar Kengashi • 61 ta maktab</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
              className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[62px] leading-[1.05]"
            >
              Har bir g‘oya —{" "}
              <span className="bk-animated-gradient bg-gradient-to-r from-[#22D3EE] via-[#818CF8] via-50% to-[#34D399] bg-clip-text text-transparent">
                kelajak sari qadam.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
              className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl"
            >
              61 ta maktab, minglab yoshlar va yagona maqsad — Baliqchi tumani kelajagini
              birgalikda yaratish.
            </motion.p>

            {/* 3 Primary CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link href="/haqida">
                <Button size="lg" variant="primary" className="shadow-xl shadow-[#4F46E5]/35">
                  Platformani o‘rganish
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/loyihalar">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:border-[#22D3EE]/50 hover:bg-white/15 dark:border-white/20 dark:bg-white/10"
                >
                  Loyihalarni ko‘rish
                </Button>
              </Link>
              <Link href="/ovoz-berish">
                <Button size="lg" variant="teal">
                  <Vote className="h-4 w-4" />
                  Ovoz berish
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-400"
            >
              <span>
                Huquqiy asos:{" "}
                <Link href="/nizom" className="text-[#22D3EE] underline-offset-4 hover:underline">
                  {PLATFORM_INFO.decreeRef}
                </Link>
              </span>
              {!isAuthenticated && (
                <>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <Link
                    href="/royxatdan-otish"
                    className="font-semibold text-[#34D399] hover:underline"
                  >
                    O‘quvchi sifatida qo‘shilish →
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          {/* Right Interactive 3D Ecosystem Showcase */}
          <motion.div
            style={{ y: cardY }}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
            className="lg:col-span-5"
          >
            <Tilt3DCard glowColor="rgba(139, 92, 246, 0.28)" maxTilt={6}>
              <div className="group rounded-3xl border border-white/15 bg-gradient-to-b from-[#111B3A]/90 to-[#091026]/95 p-5 shadow-2xl shadow-[#4F46E5]/20 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#22D3EE]">
                      Interaktiv 3D Kengash Modeli
                    </div>
                    <div className="mt-0.5 font-display text-base font-extrabold text-white">
                      61 ta Maktab • 7 ta Yo‘nalish
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/35 bg-[#10B981]/15 px-2.5 py-1 text-[11px] font-semibold text-[#34D399]">
                    <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                    3D Jonli
                  </span>
                </div>

                {/* Real Interactive 3D Orbiting 61-School Sphere */}
                <District3DConstellation className="mx-auto my-2 h-56 w-full sm:h-64" />

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/kelajak-liderlari"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition-all hover:border-[#A78BFA]/50 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A78BFA]">
                      <Award className="h-3.5 w-3.5" />
                      Tuman darajasi
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-white">
                      1 Lider • 7 Koordinator
                    </div>
                  </Link>
                  <Link
                    href="/maktablar"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 transition-all hover:border-[#34D399]/50 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#34D399]">
                      <School className="h-3.5 w-3.5" />
                      Maktab profillari
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-white">
                      61 ta mustaqil Kengash
                    </div>
                  </Link>
                </div>

                {activeWeek && (
                  <div className="mt-3 rounded-2xl border border-[#22D3EE]/30 bg-gradient-to-r from-[#4F46E5]/20 via-[#2563EB]/20 to-[#06B6D4]/20 p-3.5">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-sky-200">
                      <span className="truncate">Faol hafta: {activeWeek.title}</span>
                      <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-white">
                        {totalVotesInWeek} ovoz
                      </span>
                    </div>
                    <CountdownTimer endsAt={activeWeek.ends_at} />
                  </div>
                )}
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>

        {/* Real-Time Animated Statistics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: EASE }}
          className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7"
        >
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group rounded-2xl border border-white/10 bg-[#0E1733]/75 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#22D3EE]/45 hover:bg-[#132046] hover:shadow-lg hover:shadow-[#4F46E5]/15"
              >
                <Icon className={`h-5 w-5 ${item.color} transition-transform duration-200 group-hover:scale-110`} />
                <div className="mt-2 font-display text-2xl font-extrabold text-white">
                  <AnimatedCounter value={item.value} />
                </div>
                <div className="mt-0.5 text-xs font-medium text-slate-300 leading-snug">
                  {item.label}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-8 flex justify-center"
        >
          <a
            href="#kengash-haqida"
            aria-label="Pastga tushish"
            className="inline-flex flex-col items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#22D3EE] transition-colors"
          >
            <span>Platformani kashf eting</span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5"
            >
              <ArrowDown className="h-4 w-4" />
            </motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
