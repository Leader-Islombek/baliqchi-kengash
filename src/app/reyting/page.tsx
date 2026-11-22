import Link from "next/link";
import { Award, Medal, Scale, Trophy } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { getRankingSettings, getSchoolRankings } from "@/core/db/queries";
import type { RankingPeriod } from "@/core/types/database";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Faol maktablar reytingi",
};

const PERIOD_TABS: { key: RankingPeriod; label: string }[] = [
  { key: "overall", label: "Umumiy reyting" },
  { key: "monthly", label: "Oylik reyting" },
  { key: "weekly", label: "Haftalik reyting" },
];

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period: RankingPeriod =
    sp.period === "weekly" || sp.period === "monthly" ? sp.period : "overall";

  const [rankings, weights] = await Promise.all([
    getSchoolRankings(period, 61),
    getRankingSettings(),
  ]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div>
      <PageHeader
        badge="61 ta maktab • Ko‘p mezonli reyting"
        title="Faol maktablar reytingi"
        description="Maktablar faqat ovozlar soniga emas — amalga oshirilgan loyihalar, tadbirlar, hisobotlar, yo‘nalishlar faolligi va ishtirok ko‘rsatkichlari asosida baholanadi."
      >
        <div className="flex flex-wrap gap-2">
          {PERIOD_TABS.map((tab) => (
            <Link key={tab.key} href={`/reyting?period=${tab.key}`}>
              <Button
                variant={period === tab.key ? "teal" : "outline"}
                size="sm"
                className={
                  period === tab.key
                    ? ""
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                }
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Shaffof baholash mezonlari */}
        <Card className="p-5 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
            <Scale className="h-4 w-4 text-blue-600 dark:text-sky-400" />
            Amaldagi reyting mezonlari (Administrator tomonidan sozlanadi)
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Yakunlangan loyiha</div>
              <div className="font-display text-base font-bold text-blue-600 dark:text-sky-400">
                +{weights.completed_projects_weight} ball
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Jarayondagi loyiha</div>
              <div className="font-display text-base font-bold text-teal-600 dark:text-teal-400">
                +{weights.in_progress_projects_weight} ball
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Tadbirlar</div>
              <div className="font-display text-base font-bold text-indigo-600 dark:text-indigo-400">
                +{weights.events_weight} ball
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Hisobotlar</div>
              <div className="font-display text-base font-bold text-cyan-600 dark:text-cyan-400">
                +{weights.reports_weight} ball
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Faol yo‘nalish</div>
              <div className="font-display text-base font-bold text-amber-600 dark:text-amber-400">
                +{weights.direction_activity_weight} ball
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900/70 p-3 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Faol ishtirokchi</div>
              <div className="font-display text-base font-bold text-emerald-600 dark:text-emerald-400">
                +{weights.participation_weight} ball
              </div>
            </div>
          </div>
        </Card>

        {rankings.length > 0 ? (
          <>
            {/* Top-3 Podium */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {top3.map((r, i) => {
                const podiumStyle =
                  i === 0
                    ? "border-amber-400/60 bg-gradient-to-br from-amber-500/10 to-yellow-500/5"
                    : i === 1
                    ? "border-slate-400/50 bg-gradient-to-br from-slate-500/10 to-slate-400/5"
                    : "border-orange-400/50 bg-gradient-to-br from-orange-500/10 to-amber-500/5";
                const Icon = i === 0 ? Trophy : i === 1 ? Medal : Award;
                return (
                  <Link
                    key={r.id}
                    href={`/maktablar/${r.school?.slug || r.school_id}`}
                  >
                    <Card className={`p-6 h-full ${podiumStyle} hover:shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <Badge className="border-slate-300 dark:border-slate-700 font-bold">
                          <Icon className="h-3.5 w-3.5" />
                          {r.rank_position}-o‘rin
                        </Badge>
                        <span className="font-display text-2xl font-extrabold text-blue-600 dark:text-sky-400">
                          {r.total_score} ball
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                        {r.school?.name}
                      </h3>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2">
                          <div className="font-bold">{r.metrics_breakdown?.completed_projects || 0}</div>
                          <div className="text-slate-500">Yakunlangan</div>
                        </div>
                        <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2">
                          <div className="font-bold">{r.metrics_breakdown?.events_count || 0}</div>
                          <div className="text-slate-500">Tadbir</div>
                        </div>
                        <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2">
                          <div className="font-bold">{r.metrics_breakdown?.reports_count || 0}</div>
                          <div className="text-slate-500">Hisobot</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Qolgan maktablar jadvali */}
            {rest.length > 0 && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3.5">O‘rin</th>
                        <th className="px-5 py-3.5">Maktab</th>
                        <th className="px-5 py-3.5">Yakunlangan</th>
                        <th className="px-5 py-3.5">Jarayonda</th>
                        <th className="px-5 py-3.5">Tadbirlar</th>
                        <th className="px-5 py-3.5">Hisobotlar</th>
                        <th className="px-5 py-3.5 text-right">Jami ball</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rest.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5 font-display font-bold">#{r.rank_position}</td>
                          <td className="px-5 py-3.5 font-medium">
                            <Link
                              href={`/maktablar/${r.school?.slug || r.school_id}`}
                              className="hover:text-blue-600 dark:hover:text-sky-400"
                            >
                              {r.school?.name}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">{r.metrics_breakdown?.completed_projects || 0}</td>
                          <td className="px-5 py-3.5">{r.metrics_breakdown?.active_projects || 0}</td>
                          <td className="px-5 py-3.5">{r.metrics_breakdown?.events_count || 0}</td>
                          <td className="px-5 py-3.5">{r.metrics_breakdown?.reports_count || 0}</td>
                          <td className="px-5 py-3.5 text-right font-display font-bold text-blue-600 dark:text-sky-400">
                            {r.total_score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Trophy className="h-7 w-7" />}
            title="Reyting ma’lumotlari hali hisoblanmagan"
            description="Ma’lumotlar bazasida loyihalar, tadbirlar va hisobotlar kiritilgach, Administrator panelidan reyting bir tugmada qayta hisoblanadi."
            actionHref="/maktablar"
            actionLabel="61 ta maktabni ko‘rish"
          />
        )}
      </div>
    </div>
  );
}
