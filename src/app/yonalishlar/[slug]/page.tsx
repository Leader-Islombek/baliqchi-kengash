import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/shared/project-card";
import { getCoordinators, getDirectionBySlug, getProjects } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function DirectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const direction = await getDirectionBySlug(slug);
  if (!direction) notFound();

  const [projects, coordinators] = await Promise.all([
    getProjects({ directionId: direction.id.startsWith("dir-") ? undefined : direction.id }),
    getCoordinators(["district_coordinator", "school_coordinator"]),
  ]);

  const filteredProjects = direction.id.startsWith("dir-")
    ? []
    : projects;
  const dirCoordinators = coordinators.filter(
    (c) => c.direction?.slug === direction.slug
  );
  const districtCoord = dirCoordinators.find((c) => c.role === "district_coordinator");
  const schoolCoords = dirCoordinators.filter((c) => c.role === "school_coordinator");

  return (
    <div>
      <PageHeader
        badge="Rasmiy yo‘nalish"
        title={direction.name}
        description={direction.description}
      >
        <Link href="/yonalishlar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Barcha yo‘nalishlar
          </Button>
        </Link>
        <Link href="/loyihalar/yangi">
          <Button variant="teal">Loyiha joylash</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {direction.duties_summary && (
          <Card className="p-6 border-blue-500/25 bg-blue-500/5">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-sky-300">
              <ShieldCheck className="h-4 w-4" />
              Nizom bo‘yicha koordinator vazifalari
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {direction.duties_summary}
            </p>
          </Card>
        )}

        {/* Tuman koordinatori */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tuman yo‘nalish koordinatori
            </div>
            {districtCoord?.user ? (
              <div className="mt-3">
                <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {districtCoord.user.first_name} {districtCoord.user.last_name}
                </div>
                <Badge className="mt-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  Guruh boshqaruvchisi
                </Badge>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Tuman yo‘nalish koordinatori Super Administrator tomonidan tayinlanishi kutilmoqda.
              </p>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-base font-bold">
                <Users className="h-4 w-4 text-blue-500" />
                Maktab koordinatorlari ({schoolCoords.length} / 61)
              </div>
              <Link href="/koordinatorlar" className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline">
                Barchasi →
              </Link>
            </div>
            {schoolCoords.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {schoolCoords.slice(0, 6).map((sc) => (
                  <div
                    key={sc.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm flex items-center justify-between"
                  >
                    <span className="font-medium">
                      {sc.user?.first_name} {sc.user?.last_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {sc.school ? `${sc.school.school_number}-maktab` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Ushbu yo‘nalishda tasdiqlangan maktab koordinatorlari qo‘shilishi bilan ro‘yxat avtomatik yangilanadi.
              </p>
            )}
          </Card>
        </div>

        {/* Loyihalar */}
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {direction.name} yo‘nalishidagi loyihalar ({filteredProjects.length})
          </h2>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Ushbu yo‘nalishda hali loyihalar e’lon qilinmagan"
              description="Koordinatorlar va vakolatli o‘quvchilar loyiha joylagach va moderatsiyadan o‘tgach shu yerda ko‘rinadi."
              actionHref="/loyihalar/yangi"
              actionLabel="Yangi loyiha yaratish"
            />
          )}
        </div>
      </div>
    </div>
  );
}
