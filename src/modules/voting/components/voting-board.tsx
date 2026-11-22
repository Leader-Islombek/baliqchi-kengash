"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Info, Search } from "lucide-react";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { Input, Select } from "@/core/ui/primitives/fields";
import { DirectionIcon, getDirectionStyle } from "@/core/ui/shared/direction-icon";
import { VoteButton } from "@/modules/voting/components/vote-button";
import type { Direction, Project } from "@/core/types/database";

export function VotingBoard({
  initialNominees,
  directions,
  initialVotedProjectId,
  isAuthenticated,
}: {
  initialNominees: Project[];
  directions: Direction[];
  initialVotedProjectId: string | null;
  isAuthenticated: boolean;
}) {
  const [nominees, setNominees] = useState<Project[]>(initialNominees);
  const [votedId, setVotedId] = useState<string | null>(initialVotedProjectId);
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"votes" | "newest">("votes");

  const totalVotes = useMemo(
    () => nominees.reduce((sum, p) => sum + (p.votes_count || 0), 0),
    [nominees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = nominees.filter((p) => {
      const dirOk = selectedDirection === "all" || p.direction?.slug === selectedDirection;
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.school?.name || "").toLowerCase().includes(q) ||
        String(p.school?.school_number || "").includes(q);
      return dirOk && qOk;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return (b.votes_count || 0) - (a.votes_count || 0);
    });
  }, [nominees, selectedDirection, query, sortBy]);

  function handleVoted(projectId: string, nextVotes: number) {
    setVotedId(projectId);
    setNominees((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, votes_count: nextVotes } : p))
    );
  }

  const votedProject = nominees.find((n) => n.id === votedId);

  return (
    <div className="space-y-6">
      {votedProject && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#10B981]/35 bg-[#10B981]/10 px-5 py-3.5 text-sm">
          <div className="flex items-center gap-2.5 text-[#065F46] dark:text-[#34D399]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              Sizning joriy haftalik ovozingiz: <strong>{votedProject.title}</strong>
            </span>
          </div>
          <Link
            href={`/loyihalar/${votedProject.slug}`}
            className="text-xs font-bold text-[#059669] dark:text-[#34D399] hover:underline"
          >
            Loyihani ko‘rish →
          </Link>
        </div>
      )}

      {/* Animated Direction Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#111C35] p-2">
        {[
          { slug: "all", label: `Barchasi (${nominees.length})` },
          ...directions.map((d) => ({ slug: d.slug, label: d.short_name })),
        ].map((tab) => {
          const active = selectedDirection === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => setSelectedDirection(tab.slug)}
              className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? "text-white"
                  : "text-[#64748B] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="voting-dir-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 -z-0 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Loyiha nomi yoki maktab raqami bo‘yicha qidirish..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#64748B] whitespace-nowrap">
            Jami ovozlar: <strong className="text-[#172033] dark:text-white">{totalVotes}</strong>
          </span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "votes" | "newest")}
            className="w-44 h-10 text-xs"
            aria-label="Saralash"
          >
            <option value="votes">Eng ko‘p ovoz</option>
            <option value="newest">Eng yangi</option>
          </Select>
        </div>
      </div>

      {/* Nominee Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((proj, index) => {
            const st = getDirectionStyle(proj.direction?.accent_color);
            const share = totalVotes > 0 ? Math.round((proj.votes_count / totalVotes) * 100) : 0;
            const isSelected = votedId === proj.id;

            return (
              <Card
                key={proj.id}
                className={`overflow-hidden rounded-3xl transition-all hover:shadow-lg ${
                  isSelected
                    ? "border-[#10B981] ring-2 ring-[#10B981]/25"
                    : index === 0 && sortBy === "votes"
                    ? "border-[#2563EB]/50 ring-1 ring-[#2563EB]/20"
                    : ""
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B1224] dark:bg-white text-white dark:text-[#0B1224] font-display text-xs font-extrabold">
                        #{index + 1}
                      </span>
                      <Badge className={`${st.bg} ${st.text} ${st.border}`}>
                        <DirectionIcon name={proj.direction?.icon_name} className="h-3.5 w-3.5" />
                        {proj.direction?.name}
                      </Badge>
                    </div>
                    <span className="text-xs font-semibold text-[#64748B]">
                      {proj.school ? `${proj.school.school_number}-maktab` : "Baliqchi tumani"}
                    </span>
                  </div>

                  <div>
                    <Link
                      href={`/loyihalar/${proj.slug}`}
                      className="font-display text-lg font-bold text-[#172033] dark:text-white hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors"
                    >
                      {proj.title}
                    </Link>
                    <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.goal}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#172033] dark:text-white">
                        {proj.votes_count} ta ovoz
                      </span>
                      <span className="font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                        {share}% ulush
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1B2B4B]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#10B981]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EEF3FF] dark:border-[#22345A]">
                    <Link
                      href={`/loyihalar/${proj.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Loyihani to‘liq o‘qish
                    </Link>
                    <VoteButton
                      projectId={proj.id}
                      projectTitle={proj.title}
                      directionName={proj.direction?.name}
                      schoolName={
                        proj.school ? `${proj.school.school_number}-maktab` : "Baliqchi tumani"
                      }
                      initialVotes={proj.votes_count}
                      userVotedProjectId={votedId}
                      isAuthenticated={isAuthenticated}
                      onVotedSuccess={handleVoted}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center text-sm text-[#64748B]">
          Tanlangan filtr bo‘yicha nomzod loyihalar topilmadi.
        </Card>
      )}
    </div>
  );
}
