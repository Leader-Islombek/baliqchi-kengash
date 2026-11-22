import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Compass,
  Layers,
  Megaphone,
  Trophy,
  Users,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { ProjectCard } from "@/modules/projects/components/project-card";
import { OFFICIAL_CLUBS_LIST, OFFICIAL_DIRECTIONS } from "@/core/config/official-data";
import { getSchoolBySlugOrNumber } from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";

export default async function SchoolProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSchoolBySlugOrNumber(id);

  if (!data.school) {
    notFound();
  }

  const { school, coordinators, classReps, clubs, projects, events, announcements, studentsCount, ranking } =
    data;

  const schoolLeader = coordinators.find((c) => c.role === "school_leader");
  const schoolAdvisor = coordinators.find((c) => c.role === "school_advisor");
  const directionCoords = coordinators.filter((c) => c.role === "school_coordinator");
  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <div>
      <PageHeader
        badge={`Maktab #${school.school_number} • Baliqchi tumani`}
        title={school.name}
        description={
          school.description ||
          `Baliqchi tumani ${school.school_number}-sonli maktab O‘quvchilar Kengashining mustaqil raqamli profili.`
        }
      >
        <Link href="/maktablar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            61 ta maktab
          </Button>
        </Link>
        <Link href="/reyting">
          <Button variant="teal">
            <Trophy className="h-4 w-4" />
            Reyting: {ranking ? `#${ranking.rank_position}` : "Hisoblanmoqda"}
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Maktab faolligi statistikasi */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Ro‘yxatdan o‘tgan o‘quvchilar", value: studentsCount, icon: Users },
            { label: "Koordinator va liderlar", value: coordinators.length, icon: Compass },
            { label: "Joylangan loyihalar", value: projects.length, icon: Layers },
            { label: "Amalga oshirilgan", value: completedProjects.length, icon: CheckCircle2 },
            { label: "Tadbirlar", value: events.length, icon: Calendar },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <Icon className="h-5 w-5 text-blue-600 dark:text-sky-400" />
                <div className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Kelajak Lideri va Maktab Maslahatchisi */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-6 border-blue-500/30">
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-sky-300">
              <Award className="h-3.5 w-3.5" />
              Maktab Kelajak Lideri
            </Badge>
            {schoolLeader?.user ? (
              <div className="mt-4">
                <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {schoolLeader.user.first_name} {schoolLeader.user.last_name}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {schoolLeader.user.grade ? `${schoolLeader.user.grade}-sinf o‘quvchisi` : "Maktab Kengashi rahbari"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Ushbu maktabning Kelajak Lideri hali tayinlanmagan.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Maktab maslahatchisi
            </Badge>
            {schoolAdvisor?.user ? (
              <div className="mt-4">
                <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {schoolAdvisor.user.first_name} {schoolAdvisor.user.last_name}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Kengash faoliyatini muvofiqlashtiruvchi maslahatchi
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Maktab maslahatchisi profili biriktirilishi kutilmoqda.
              </p>
            )}
          </Card>
        </div>

        {/* 7 ta yo'nalish koordinatori */}
        <section>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-4">
            7 ta yo‘nalish koordinatori
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OFFICIAL_DIRECTIONS.map((dir) => {
              const assigned = directionCoords.find((c) => c.direction?.slug === dir.slug);
              return (
                <Card key={dir.slug} className="p-4">
                  <div className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                    {dir.name} koordinatori
                  </div>
                  <div className="mt-1.5 font-display text-sm font-bold text-slate-900 dark:text-white">
                    {assigned?.user
                      ? `${assigned.user.first_name} ${assigned.user.last_name}`
                      : "Tayinlanmagan"}
                  </div>
                  {assigned?.user?.grade && (
                    <div className="text-xs text-slate-500">{assigned.user.grade}-sinf</div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Sinf vakillari va Klublar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Sinf vakillari (5–11-sinflar)
            </h3>
            {classReps.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classReps.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{rep.full_name}</span>
                    <Badge className="border-slate-300 dark:border-slate-700">
                      {rep.grade}-{rep.class_letter}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Maktab Kelajak Lideri tomonidan 5–11-sinf vakillari kiritilgach bu yerda ko‘rinadi.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Klublar va to‘garaklar
            </h3>
            {clubs.length > 0 ? (
              <div className="mt-4 space-y-2">
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <div className="font-semibold text-sm">{club.name}</div>
                    {club.description && (
                      <p className="text-xs text-slate-500 mt-1">{club.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nizom asosida tashkil etiladigan namunaviy klublar:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {OFFICIAL_CLUBS_LIST.map((c) => (
                    <Badge key={c} className="border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Maktab loyihalari */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Maktab loyihalari ({projects.length})
            </h2>
            <Link href="/loyihalar/yangi">
              <Button variant="primary" size="sm">Loyiha joylash</Button>
            </Link>
          </div>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Ushbu maktabdan hali loyiha joylanmagan"
              description="Maktab koordinatorlari va Kelajak Lideri o‘z tashabbuslarini joylagach bu yerda ko‘rinadi."
              actionHref="/loyihalar/yangi"
              actionLabel="Birinchi loyihani yaratish"
            />
          )}
        </section>

        {/* Tadbirlar va Yangiliklar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-teal-500" />
              <h3 className="font-display text-lg font-bold">Maktab tadbirlari ({events.length})</h3>
            </div>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/tadbirlar/${ev.slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-teal-500/40"
                  >
                    <div className="text-xs text-slate-500">{formatUzDate(ev.starts_at, true)}</div>
                    <div className="font-semibold text-sm mt-0.5">{ev.title}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Hozircha tadbirlar kiritilmagan.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-5 w-5 text-blue-500" />
              <h3 className="font-display text-lg font-bold">Maktab yangiliklari ({announcements.length})</h3>
            </div>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((an) => (
                  <Link
                    key={an.id}
                    href={`/yangiliklar/${an.slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-blue-500/40"
                  >
                    <div className="text-xs text-slate-500">{formatUzDate(an.published_at)}</div>
                    <div className="font-semibold text-sm mt-0.5">{an.title}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Hozircha yangiliklar kiritilmagan.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
