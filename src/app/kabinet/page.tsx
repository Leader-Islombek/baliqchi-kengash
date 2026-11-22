import Link from "next/link";
import {
  Award,
  Bell,
  CheckCircle2,
  Compass,
  MessageSquare,
  Plus,
  School,
  ShieldCheck,
  Trophy,
  Vote,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { ProjectCard } from "@/modules/projects/components/project-card";
import {
  ActivityReportForm,
  QuickAnnouncementForm,
  QuickEventForm,
  StudentInitiativeForm,
} from "@/modules/accounts/components/cabinet-forms";
import { ProfileEditButton } from "@/modules/accounts/components/profile-edit-modal";
import { ROLE_META } from "@/core/config/official-data";
import { hasPermission } from "@/core/security/permissions";
import {
  getActiveVotingData,
  getCoordinators,
  getCurrentUserContext,
  getDirections,
  getPlatformStats,
  getProjects,
  getReports,
  getSchools,
} from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shaxsiy kabinet",
};

export default async function CabinetPage() {
  const userCtx = await getCurrentUserContext();

  if (!userCtx) {
    return (
      <div>
        <PageHeader
          badge="Shaxsiy kabinet"
          title="Kabinetga kirish talab etiladi"
          description="O‘z rolingizga mos boshqaruv panelini ko‘rish uchun tizimga kiring."
        />
        <div className="mx-auto max-w-3xl px-4 py-12">
          <EmptyState
            title="Siz tizimga kirmagansiz"
            description="Oddiy o‘quvchi, Koordinator, Kelajak Lideri yoki Administrator kabinetiga kirish uchun login qiling."
            actionHref="/kirish"
            actionLabel="Tizimga kirish"
          />
        </div>
      </div>
    );
  }

  const [
    directions,
    schools,
    stats,
    votingData,
    recentProjects,
    reports,
    coordinators,
  ] = await Promise.all([
    getDirections(),
    getSchools(),
    getPlatformStats(),
    getActiveVotingData(userCtx.user.id),
    getProjects({ limit: 6, includeAllStatuses: userCtx.isDistrictLeader || userCtx.isSuperAdmin }),
    getReports(10),
    getCoordinators(),
  ]);

  const roleMeta = ROLE_META[userCtx.primaryRole];
  const canCreateProject = hasPermission(userCtx, "project:create");
  const canReport = hasPermission(userCtx, "report:create");
  const canCreateEvent = hasPermission(userCtx, "event:create");
  const canAnnounce = hasPermission(userCtx, "announcement:create");
  const canAccessGroups =
    hasPermission(userCtx, "group:access_direction") ||
    hasPermission(userCtx, "group:access_future_leaders");

  const pendingRoles = userCtx.roles.filter((r) => r.status === "pending");
  const mySchoolCoords = coordinators.filter(
    (c) => c.school_id && c.school_id === userCtx.user.school_id
  );
  const winnersUnderReview = recentProjects.filter((p) =>
    ["weekly_winner", "under_review"].includes(p.status)
  );

  return (
    <div>
      <PageHeader
        badge={roleMeta.label}
        title={`Xush kelibsiz, ${userCtx.user.first_name} ${userCtx.user.last_name}!`}
        description={roleMeta.description}
      >
        <ProfileEditButton user={userCtx.user} />
        {canCreateProject && (
          <Link href="/loyihalar/yangi">
            <Button variant="teal">
              <Plus className="h-4 w-4" />
              Yangi loyiha
            </Button>
          </Link>
        )}
        {canAccessGroups && (
          <Link href="/guruhlar">
            <Button variant="primary">
              <MessageSquare className="h-4 w-4" />
              Guruhlar
            </Button>
          </Link>
        )}
        {userCtx.isSuperAdmin && (
          <Link href="/admin">
            <Button variant="danger">
              <ShieldCheck className="h-4 w-4" />
              Super Admin Panel
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Kutilayotgan rol arizalari haqida ogohlantirish */}
        {pendingRoles.length > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <strong>Kutilayotgan ariza:</strong> Sizning{" "}
            {pendingRoles.map((r) => ROLE_META[r.role].label).join(", ")} lavozimiga yuborgan
            arizangiz Super Administrator ko‘rib chiqishida. Tasdiqlangach vakolatlar avtomatik ochiladi.
          </Card>
        )}

        {/* Profil va tezkor ko'rsatkichlar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <School className="h-4 w-4 text-blue-500" />
              Maktab va sinf
            </div>
            <div className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
              {userCtx.user.school
                ? `${userCtx.user.school.school_number}-maktab`
                : "Biriktirilmagan"}
            </div>
            <div className="text-xs text-slate-500">
              {userCtx.user.grade ? `${userCtx.user.grade}-sinf` : roleMeta.shortLabel}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Vote className="h-4 w-4 text-teal-500" />
              Haftalik ovoz holati
            </div>
            <div className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
              {votingData.activeWeek
                ? votingData.userVotedProjectId
                  ? "Ovoz berilgan"
                  : "1 ta ovoz mavjud"
                : "Ovoz berish yopiq"}
            </div>
            <Link href="/ovoz-berish" className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline">
              Ovoz berish sahifasi →
            </Link>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Bell className="h-4 w-4 text-amber-500" />
              Bildirishnomalar
            </div>
            <div className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
              {userCtx.unreadNotificationsCount} ta o‘qilmagan
            </div>
            <Link href="/bildirishnomalar" className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline">
              Barchasini ko‘rish →
            </Link>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Hisob maqomi
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={roleMeta.badgeColor}>{roleMeta.shortLabel}</Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {userCtx.user.is_verified ? "Tasdiqlangan hisob" : "Tasdiqlanmoqda"}
            </div>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* TUMAN KELAJAK LIDERI MAXSUS DASHBOARD BLOKI */}
        {/* ============================================================ */}
        {(userCtx.isDistrictLeader || userCtx.isSuperAdmin) && (
          <Card className="border-blue-500/30 bg-gradient-to-br from-[#0a162d] to-[#122a54] p-6 text-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge className="border-sky-400/30 bg-sky-400/15 text-sky-300">
                  <Award className="h-3.5 w-3.5" />
                  Tuman Kelajak Lideri Boshqaruv Markazi
                </Badge>
                <h2 className="mt-2 font-display text-xl font-bold">
                  61 ta maktab va 7 ta yo‘nalish tuman monitoringi
                </h2>
              </div>
              <div className="flex gap-2">
                <Link href="/guruhlar/kelajak-liderlari">
                  <Button variant="teal" size="sm">Kelajak Liderlari guruhi</Button>
                </Link>
                <Link href="/reyting">
                  <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    <Trophy className="h-4 w-4" /> Reyting
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white/10 p-3.5">
                <div className="text-xs text-sky-200">Maktablar</div>
                <div className="font-display text-2xl font-bold">{stats.schoolsCount}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3.5">
                <div className="text-xs text-sky-200">Koordinator/Lider</div>
                <div className="font-display text-2xl font-bold">{stats.coordinatorsCount}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3.5">
                <div className="text-xs text-sky-200">Jami loyihalar</div>
                <div className="font-display text-2xl font-bold">{stats.totalProjectsCount}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3.5">
                <div className="text-xs text-sky-200">Ko‘rib chiqishda</div>
                <div className="font-display text-2xl font-bold">{winnersUnderReview.length}</div>
              </div>
            </div>
          </Card>
        )}

        {/* ============================================================ */}
        {/* MAKTAB KELAJAK LIDERI / MASLAHATCHISI JAMOA MONITORINGI */}
        {/* ============================================================ */}
        {(userCtx.isSchoolLeader || userCtx.isSchoolAdvisor) && userCtx.user.school && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-lg font-bold">
                <Compass className="h-5 w-5 text-blue-500" />
                {userCtx.user.school.school_number}-maktab Kengashi jamoasi ({mySchoolCoords.length})
              </div>
              <Link
                href={`/maktablar/${userCtx.user.school.slug}`}
                className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline"
              >
                Maktab profilini ochish →
              </Link>
            </div>
            {mySchoolCoords.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {mySchoolCoords.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm"
                  >
                    <div className="font-semibold">
                      {c.user?.first_name} {c.user?.last_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.direction?.name || ROLE_META[c.role].shortLabel}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Maktabingizning 7 yo‘nalish koordinatori tasdiqlangach shu yerda ko‘rinadi.
              </p>
            )}
          </Card>
        )}

        {/* ============================================================ */}
        {/* ROLGA MOS AMALIY FORMALAR */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Oddiy o'quvchi uchun tashabbus yuborish */}
          <StudentInitiativeForm directions={directions} />

          {/* Koordinatorlar va Liderlar uchun hisobot topshirish */}
          {canReport && (
            <ActivityReportForm
              directions={directions}
              schoolId={userCtx.user.school_id}
            />
          )}

          {/* Tadbir joylash */}
          {canCreateEvent && (
            <QuickEventForm
              directions={directions}
              schools={schools}
              defaultSchoolId={userCtx.user.school_id}
            />
          )}

          {/* Yangilik / e'lon joylash */}
          {canAnnounce && (
            <QuickAnnouncementForm
              schools={schools}
              defaultSchoolId={userCtx.isDistrictLeader || userCtx.isSuperAdmin ? null : userCtx.user.school_id}
            />
          )}
        </div>

        {/* So'nggi hisobotlar (Liderlar, Koordinatorlar, Maslahatchilar uchun) */}
        {reports.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="font-display text-lg font-bold">So‘nggi faoliyat hisobotlari</h3>
            <div className="space-y-3">
              {reports.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-bold">
                      {r.period_label} — {r.school ? `${r.school.school_number}-maktab` : "Tuman"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {r.summary}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">
                    {formatUzDate(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* So'nggi loyihalar */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold">So‘nggi loyihalar</h2>
            <Link href="/loyihalar" className="text-sm font-semibold text-blue-600 dark:text-sky-400 hover:underline">
              Katalogga o‘tish →
            </Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentProjects.slice(0, 3).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hali loyihalar joylanmagan"
              description="Ilk loyihani yaratish yoki maktabingiz Kelajak Lideriga tashabbus yuborish orqali boshlang."
            />
          )}
        </section>
      </div>
    </div>
  );
}
