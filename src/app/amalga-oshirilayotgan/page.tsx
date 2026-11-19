import Link from "next/link";
import { CheckCircle2, Rocket } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/shared/project-card";
import { getProjects, getRecentProjectUpdates } from "@/lib/data/queries";
import { formatUzDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Amalga oshirilayotgan loyihalar",
};

export default async function ImplementationPage() {
  const [inProgress, completed, updates] = await Promise.all([
    getProjects({ status: ["approved", "in_progress"] }),
    getProjects({ status: "completed" }),
    getRecentProjectUpdates(8),
  ]);

  return (
    <div>
      <PageHeader
        badge="Real vaqt monitoringi"
        title="Amalga oshirilayotgan va yakunlangan loyihalar"
        description="Tuman darajasida tasdiqlangan loyihalarning bajarilish foizi, haftalik hisobotlari, foto-dalillari va yakuniy natijalari."
      >
        <Link href="/loyihalar">
          <Button variant="primary">Barcha loyihalar</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-14">
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <Rocket className="h-5 w-5 text-teal-500" />
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Jarayondagi loyihalar ({inProgress.length})
            </h2>
          </div>

          {inProgress.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inProgress.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Rocket className="h-7 w-7" />}
              title="Hozircha jarayonga olingan loyihalar yo‘q"
              description="Tasdiqlangan loyihalar bu yerda bajarilish foizi (progress bar) va haftalik foto-hisobotlar bilan ko‘rinadi."
              actionHref="/ovoz-berish"
              actionLabel="Ovoz berishni ko‘rish"
            />
          )}
        </section>

        {updates.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
              So‘nggi monitoring yangilanishlari
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {updates.map((u) => (
                <Card key={u.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                      {u.progress_percent}% bajarildi
                    </Badge>
                    <span className="text-xs text-slate-500">{formatUzDate(u.created_at, true)}</span>
                  </div>
                  <Link
                    href={u.project ? `/loyihalar/${u.project.slug}` : "/loyihalar"}
                    className="block font-display text-base font-bold text-slate-900 dark:text-white hover:text-blue-600"
                  >
                    {u.project?.title} — {u.title}
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{u.content}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Muvaffaqiyatli yakunlangan loyihalar ({completed.length})
            </h2>
          </div>

          {completed.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completed.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-7 w-7" />}
              title="Yakunlangan loyihalar tez orada qo‘shiladi"
              description="100% bajarilgan va natijalari tasdiqlangan loyihalar ushbu bo‘limda abadiy saqlanadi."
            />
          )}
        </section>
      </div>
    </div>
  );
}
