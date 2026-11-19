import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/fields";
import { ProjectCard } from "@/components/shared/project-card";
import { PROJECT_STATUS_META } from "@/lib/constants/official-data";
import {
  getCurrentUserContext,
  getDirections,
  getProjects,
  getSchools,
} from "@/lib/data/queries";
import { hasPermission } from "@/lib/auth/permissions";
import type { ProjectStatus } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Loyihalar katalogi",
};

export default async function ProjectsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; direction?: string; school?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const [userCtx, directions, schools, projects] = await Promise.all([
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
        {/* Filtrlar */}
        <Card className="p-4">
          <form method="GET" className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={sp.q || ""}
                placeholder="Loyiha nomi bo‘yicha qidirish..."
                className="pl-10"
              />
            </div>
            <div className="md:col-span-3">
              <Select name="direction" defaultValue={sp.direction || ""}>
                <option value="">Barcha 7 yo‘nalish</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select name="school" defaultValue={sp.school || ""}>
                <option value="">Barcha 61 maktab</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.school_number}-maktab
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select name="status" defaultValue={sp.status || ""}>
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
            <div className="md:col-span-1">
              <Button type="submit" variant="primary" className="w-full h-11">
                Topish
              </Button>
            </div>
          </form>
        </Card>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Filtr bo‘yicha loyihalar topilmadi"
            description="Loyihalar koordinatorlar va vakolatli foydalanuvchilar tomonidan joylanib, moderatsiyadan o‘tgach shu yerda ko‘rinadi."
            actionHref={canCreate ? "/loyihalar/yangi" : "/kabinet"}
            actionLabel={canCreate ? "Yangi loyiha yaratish" : "Tashabbus yuborish"}
          />
        )}
      </div>
    </div>
  );
}
