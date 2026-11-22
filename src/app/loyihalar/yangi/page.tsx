import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Button } from "@/core/ui/primitives/button";
import { ProjectCreateForm } from "@/modules/projects/components/project-form";
import { getCurrentUserContext, getDirections, getSchools } from "@/core/db/queries";
import { hasPermission } from "@/core/security/permissions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Yangi loyiha yaratish",
};

export default async function NewProjectPage() {
  const [userCtx, directions, schools] = await Promise.all([
    getCurrentUserContext(),
    getDirections(),
    getSchools(),
  ]);

  const canCreate = hasPermission(userCtx, "project:create");

  return (
    <div>
      <PageHeader
        badge="12 bo‘limli rasmiy loyiha shakli"
        title="Yangi loyiha yaratish"
        description="Barcha 12 ta bandni aniq va batafsil to‘ldiring. Loyiha moderatsiyadan o‘tgandan so‘ng haftalik ovoz berishga chiqariladi."
      >
        <Link href="/loyihalar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            Katalogga qaytish
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!userCtx ? (
          <EmptyState
            icon={<ShieldAlert className="h-7 w-7" />}
            title="Loyiha joylash uchun tizimga kiring"
            description="Avval ro‘yxatdan o‘ting yoki hisobingizga kiring."
            actionHref="/kirish"
            actionLabel="Tizimga kirish"
          />
        ) : !canCreate ? (
          <EmptyState
            icon={<ShieldAlert className="h-7 w-7" />}
            title="Loyiha joylash uchun koordinator yoki qo‘shimcha vakolat kerak"
            description="Oddiy o‘quvchilar Shaxsiy kabinet orqali o‘z maktabining Kelajak Lideriga tashabbus yuborishi yoki administratordan qo‘shimcha vakolat olishi mumkin."
            actionHref="/kabinet"
            actionLabel="Shaxsiy kabinetga o‘tish"
          />
        ) : (
          <ProjectCreateForm
            directions={directions}
            schools={schools}
            defaultSchoolId={userCtx.user.school_id}
            authorName={`${userCtx.user.first_name} ${userCtx.user.last_name}`}
          />
        )}
      </div>
    </div>
  );
}
