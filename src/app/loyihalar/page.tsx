import Link from "next/link";
import { Plus, RotateCcw, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { Input, Select } from "@/core/ui/primitives/fields";
import { ProjectCard } from "@/modules/projects/components/project-card";
import { StaggerGrid, StaggerItem } from "@/core/ui/shared/motion-primitives";
import { PROJECT_STATUS_META } from "@/core/config/official-data";
import {
  getCurrentUserContext,
  getDirections,
  getProjects,
  getSchools,
} from "@/core/db/queries";
import { hasPermission } from "@/core/security/permissions";
import type { ProjectStatus } from "@/core/types/database";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Loyihalar katalogi",
};

export default async function ProjectsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    direction?: string;
    school?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const [userCtx, directions, schools, rawProjects] = await Promise.all([
    getCurrentUserContext(),
    getDirections(),
    getSchools(),
    getProjects({
      search: sp.q || undefined,
      directionId: sp.direction || undefined,
      schoolId: sp.school || undefined,
      status: (sp.status as ProjectStatus) || undefined,
    }),
  ]);

  const sortBy = sp.sort || "votes";
  const projects = [...rawProjects].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "progress") {
      return (b.progress_percent || 0) - (a.progress_percent || 0);
    }
    return (b.votes_count || 0) - (a.votes_count || 0);
  });

  const hasFilters = Boolean(sp.q || sp.direction || sp.school || sp.status || sp.sort);
  const canCreate = hasPermission(userCtx, "project:create");

  return (
    <div>
      <PageHeader
        badge="61 ta maktab tashabbuslari"
        title="Loyihalar va g‘oyalar katalogi"
        description="Moderatsiyadan o‘tgan barcha loyihalar: ovoz berilayotgan, haftalik g‘olib bo‘lgan, amalga oshirilayotgan va yakunlangan tashabbuslar."
      >
        <Link href="/ovoz-berish">
          <Button variant="teal">Haftalik ovoz berish</Button>
        </Link>
        {canCreate && (
          <Link href="/loyihalar/yangi">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Yangi loyiha yaratish
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <Card className="p-4 sm:p-5 rounded-3xl">
          <form method="GET" className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <Input
                name="q"
                defaultValue={sp.q || ""}
                placeholder="Loyiha nomi..."
                className="pl-10"
              />
            </div>
            <div className="md:col-span-2">
              <Select name="direction" defaultValue={sp.direction || ""} aria-label="Yo‘nalish">
                <option value="">Barcha yo‘nalishlar</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select name="school" defaultValue={sp.school || ""} aria-label="Maktab">
                <option value="">Barcha 61 maktab</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.school_number}-maktab
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select name="status" defaultValue={sp.status || ""} aria-label="Holat">
                <option value="">Barcha holatlar</option>
                {(
                  [
                    "voting",
                    "weekly_winner",
                    "under_review",
                    "approved",
                    "in_progress",
                    "completed",
                  ] as ProjectStatus[]
                ).map((st) => (
                  <option key={st} value={st}>
                    {PROJECT_STATUS_META[st].label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select name="sort" defaultValue={sortBy} aria-label="Saralash">
                <option value="votes">Eng ko‘p ovoz</option>
                <option value="newest">Eng yangi</option>
                <option value="progress">Bajarilish %</option>
              </Select>
            </div>
            <div className="md:col-span-1 flex gap-2">
              <Button type="submit" variant="primary" className="w-full h-11 px-3">
                Topish
              </Button>
            </div>
          </form>

          {hasFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-[#EEF3FF] dark:border-[#22345A] pt-3 text-xs text-[#64748B]">
              <span>Topildi: <strong>{projects.length}</strong> ta loyiha</span>
              <Link
                href="/loyihalar"
                className="inline-flex items-center gap-1 font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Filtrlarni tozalash
              </Link>
            </div>
          )}
        </Card>

        {projects.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <EmptyState
            title="Filtr bo‘yicha loyihalar topilmadi"
            description="Loyihalar koordinatorlar va vakolatli foydalanuvchilar tomonidan joylanib, moderatsiyadan o‘tgach shu yerda ko‘rinadi."
            actionHref={hasFilters ? "/loyihalar" : canCreate ? "/loyihalar/yangi" : "/kabinet"}
            actionLabel={
              hasFilters
                ? "Barcha loyihalarni ko‘rish"
                : canCreate
                ? "Yangi loyiha yaratish"
                : "Tashabbus yuborish"
            }
          />
        )}
      </div>
    </div>
  );
}
