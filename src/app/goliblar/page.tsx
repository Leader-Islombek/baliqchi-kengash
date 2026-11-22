import Link from "next/link";
import { Award, Calendar, Heart, Scale } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { ProgressBar } from "@/core/ui/primitives/fields";
import { PROJECT_STATUS_META } from "@/core/config/official-data";
import { getWeeklyWinnersArchive } from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Haftalik g‘oliblar arxivi",
};

export default async function WeeklyWinnersPage() {
  const winners = await getWeeklyWinnersArchive();

  return (
    <div>
      <PageHeader
        badge="Shaffof arxiv"
        title="Haftalik g‘olib loyihalar"
        description="Har hafta yakunida eng ko‘p ovoz olgan loyihalar arxivi va ularning Tuman Kelajak Lideri hamda koordinatorlar tomonidan ko‘rib chiqilish holati."
      >
        <Link href="/ovoz-berish">
          <Button variant="primary">Joriy ovoz berish</Button>
        </Link>
        <Link href="/amalga-oshirilayotgan">
          <Button variant="teal">Amalga oshirilayotganlar</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {winners.length > 0 ? (
          <div className="space-y-5">
            {winners.map((week) => {
              const proj = week.winner_project;
              const statusMeta = proj ? PROJECT_STATUS_META[proj.status] : null;
              return (
                <Card key={week.id} className="overflow-hidden border-violet-500/25">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-display text-base font-bold text-slate-900 dark:text-white">
                            {week.title} ({week.week_code})
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatUzDate(week.starts_at)} — {formatUzDate(week.ends_at)}
                          </div>
                        </div>
                      </div>
                      {statusMeta && (
                        <Badge className={statusMeta.colorClass}>{statusMeta.label}</Badge>
                      )}
                    </div>

                    {proj ? (
                      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
                        <div className="lg:col-span-8 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-blue-600 dark:text-sky-400">
                              {proj.direction?.name}
                            </span>
                            <span>•</span>
                            <span>
                              {proj.school ? `${proj.school.school_number}-maktab` : "Baliqchi tumani"}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                              <Heart className="h-3.5 w-3.5" /> {proj.votes_count} ta ovoz
                            </span>
                          </div>
                          <Link
                            href={`/loyihalar/${proj.slug}`}
                            className="block font-display text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-sky-400"
                          >
                            {proj.title}
                          </Link>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{proj.goal}</p>

                          {week.is_tie_resolved && week.tie_resolution_note && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300">
                              <Scale className="h-3.5 w-3.5" />
                              Teng ovoz qarori: {week.tie_resolution_note}
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-4 space-y-3">
                          <ProgressBar value={proj.progress_percent} showLabel />
                          <Link href={`/loyihalar/${proj.slug}`} className="block">
                            <Button variant="outline" size="sm" className="w-full">
                              Loyiha monitoringini ko‘rish
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">G‘olib loyiha ma’lumoti topilmadi.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Award className="h-7 w-7" />}
            title="Haftalik g‘oliblar arxivi hali bo‘sh"
            description="Ilk haftalik ovoz berish yakunlangach, barcha g‘olib loyihalar va ularning natijalari shu arxivda saqlanadi."
            actionHref="/ovoz-berish"
            actionLabel="Haftalik ovoz berishga o‘tish"
          />
        )}
      </div>
    </div>
  );
}
