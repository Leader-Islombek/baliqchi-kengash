import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { getEvents } from "@/lib/data/queries";
import { formatUzDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tadbirlar",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  planned: "Rejalashtirilgan",
  ongoing: "Bo‘lib o‘tmoqda",
  completed: "O‘tkazilgan",
  cancelled: "Bekor qilingan",
};

export default async function EventsPage() {
  const events = await getEvents(40);
  const upcoming = events.filter((e) => ["planned", "ongoing"].includes(e.status));
  const completed = events.filter((e) => e.status === "completed");

  return (
    <div>
      <PageHeader
        badge="61 ta maktab va tuman taqvimi"
        title="Tadbirlar"
        description="Rejalashtirilgan forumlar, musobaqalar, ekologik aksiyalar, madaniy tanlovlar va o‘tkazilgan tadbirlar hisoboti."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Rejalashtirilgan va joriy tadbirlar ({upcoming.length})
          </h2>
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <Link key={ev.id} href={`/tadbirlar/${ev.slug}`} className="group">
                  <Card className="h-full hover:border-teal-500/40 hover:shadow-lg">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                          {EVENT_STATUS_LABELS[ev.status]}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {ev.school ? `${ev.school.school_number}-maktab` : "Tuman"}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400">
                        {ev.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {ev.description}
                      </p>
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          {formatUzDate(ev.starts_at, true)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-teal-500" />
                          {ev.location}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="h-7 w-7" />}
              title="Hozircha rejalashtirilgan tadbirlar kiritilmagan"
              description="Maktab Kelajak Liderlari va koordinatorlar tadbirlarni kabinet orqali joylashlari mumkin."
            />
          )}
        </section>

        {completed.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
              O‘tkazilgan tadbirlar ({completed.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completed.map((ev) => (
                <Link key={ev.id} href={`/tadbirlar/${ev.slug}`}>
                  <Card className="p-6 hover:border-blue-500/40">
                    <div className="text-xs text-slate-500">{formatUzDate(ev.starts_at)}</div>
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
          </section>
        )}
      </div>
    </div>
  );
}
