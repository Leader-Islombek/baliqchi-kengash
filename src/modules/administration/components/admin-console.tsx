"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Compass,
  FileClock,
  FolderKanban,
  KeyRound,
  Loader2,
  RefreshCw,
  Scale,
  School as SchoolIcon,
  ShieldCheck,
  Trash2,
  Users,
  Vote,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Input, Label, PasswordInput, Select } from "@/core/ui/primitives/fields";
import { MotionModal } from "@/core/ui/shared/motion-primitives";
import { PROJECT_STATUS_META, ROLE_META } from "@/core/config/official-data";
import {
  adminAssignRoleDirectlyAction,
  adminCreateDirectionAction,
  adminCreateVotingWeekAction,
  adminDeleteProjectAction,
  adminDeleteUserAction,
  adminDeleteVotingWeekAction,
  adminFinalizeVotingWeekAction,
  adminRecalculateRankingsAction,
  adminResetUserPasswordAction,
  adminReviewRoleRequestAction,
  adminSetVotingWeekStatusAction,
  adminUpdateProjectAction,
  adminUpdateRankingWeightsAction,
  adminUpdateUserControlAction,
  adminUpsertSchoolAction,
} from "@/modules/administration/actions";
import { formatUzDate } from "@/core/utils";
import type {
  ActivityLog,
  Direction,
  Project,
  ProjectStatus,
  RankingSettings,
  School,
  UserProfile,
  UserRoleRecord,
  VotingWeek,
} from "@/core/types/database";

type AdminTab =
  | "roles"
  | "users"
  | "projects"
  | "voting"
  | "schools"
  | "rankings"
  | "audit";

export function AdminConsole({
  pendingRoles,
  users,
  projects,
  votingWeeks,
  schools,
  directions,
  rankingSettings,
  logs,
}: {
  pendingRoles: UserRoleRecord[];
  users: Array<UserProfile & { phone_e164?: string | null }>;
  projects: Project[];
  votingWeeks: VotingWeek[];
  schools: School[];
  directions: Direction[];
  rankingSettings: RankingSettings;
  logs: ActivityLog[];
}) {
  const [tab, setTab] = useState<AdminTab>("roles");
  const [isPending, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "project" | "week" | "user";
    id: string;
    label: string;
  } | null>(null);

  const tabs: { key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: "roles", label: "Rol arizalari", icon: ShieldCheck, badge: pendingRoles.length },
    { key: "users", label: "Foydalanuvchilar", icon: Users, badge: users.length },
    { key: "projects", label: "Loyihalar", icon: FolderKanban, badge: projects.length },
    { key: "voting", label: "Ovoz berish", icon: Vote, badge: votingWeeks.length },
    { key: "schools", label: "Maktab va Yo‘nalish", icon: SchoolIcon },
    { key: "rankings", label: "Reyting mezonlari", icon: Scale },
    { key: "audit", label: "Audit log", icon: FileClock },
  ];

  function runAction(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <div className="space-y-6">
      {/* Animated Tab Bar */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#111C35] p-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? "text-white"
                  : "text-[#64748B] dark:text-slate-300 hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                {t.label}
                {typeof t.badge === "number" && (
                  <span className="ml-0.5 rounded-full bg-black/15 dark:bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                    {t.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. ROL ARIZALARI & TO'G'RIDAN-TO'G'RI ROL TAYINLASH */}
      {tab === "roles" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">
              Tasdiqlashni kutayotgan lavozim arizalari ({pendingRoles.length})
            </h2>
            {pendingRoles.length > 0 ? (
              <div className="space-y-3">
                {pendingRoles.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold">
                        {req.user?.first_name} {req.user?.last_name}{" "}
                        <Badge className={ROLE_META[req.role].badgeColor}>
                          {ROLE_META[req.role].label}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {req.school ? `${req.school.school_number}-maktab` : "Tuman"}
                        {req.direction ? ` • ${req.direction.name}` : ""}
                        {req.request_note ? ` — "${req.request_note}"` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="teal"
                        disabled={isPending}
                        onClick={() => runAction(() => adminReviewRoleRequestAction(req.id, "approved"))}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Tasdiqlash
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isPending}
                        onClick={() => runAction(() => adminReviewRoleRequestAction(req.id, "rejected"))}
                      >
                        <XCircle className="h-4 w-4" /> Rad etish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Hozircha kutilayotgan arizalar yo‘q.</p>
            )}
          </Card>

          {/* To'g'ridan-to'g'ri rol tayinlash */}
          <Card className="p-6 space-y-4">
            <h3 className="font-display text-base font-bold">
              Istalgan foydalanuvchiga to‘g‘ridan-to‘g‘ri rol tayinlash
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                runAction(() => adminAssignRoleDirectlyAction(fd));
              }}
              className="grid grid-cols-1 gap-3 md:grid-cols-4"
            >
              <div>
                <Label>Foydalanuvchi</Label>
                <Select name="user_id" required defaultValue="">
                  <option value="" disabled>Tanlang...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.school ? `${u.school.school_number}-m` : "—"})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Lavozim / Rol</Label>
                <Select name="role" required defaultValue="school_coordinator">
                  {Object.entries(ROLE_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Maktab (ixtiyoriy)</Label>
                <Select name="school_id" defaultValue="">
                  <option value="">Tuman darajasi</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.school_number}-maktab</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Yo‘nalish (ixtiyoriy)</Label>
                <Select name="direction_id" defaultValue="">
                  <option value="">Barchasi / Shart emas</option>
                  {directions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Rolni darhol tayinlash
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. FOYDALANUVCHILAR (Maxfiy telefon raqamlari faqat Admin ko'radi!) */}
      {tab === "users" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">
            Barcha foydalanuvchilar boshqaruvi ({users.length})
          </h2>
          <p className="text-xs text-slate-500">
            Telefon raqamlari faqat Super Administratorga ko‘rinadi va ommaviy sahifalarda qat’iy yashirilgan.
          </p>
          <div className="space-y-3">
            {users.map((u) => (
              <form
                key={u.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  runAction(() => adminUpdateUserControlAction(fd));
                }}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 lg:grid-cols-12 items-center"
              >
                <input type="hidden" name="user_id" value={u.id} />
                <div className="lg:col-span-4">
                  <div className="font-semibold text-sm">
                    {u.first_name} {u.last_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.school ? `${u.school.school_number}-maktab` : "Maktabsiz"} • {u.grade ? `${u.grade}-sinf` : "—"} •{" "}
                    <span className="font-mono text-blue-600 dark:text-sky-400">
                      {u.phone_e164 || "Tel yo‘q"}
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <Select name="account_status" defaultValue={u.account_status} className="h-9 text-xs">
                    <option value="active">Faol</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="suspended">Bloklangan</option>
                    <option value="rejected">Rad etilgan</option>
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <Select name="is_verified" defaultValue={String(u.is_verified)} className="h-9 text-xs">
                    <option value="true">Tasdiqlangan</option>
                    <option value="false">Tasdiqlanmagan</option>
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <Select
                    name="can_submit_projects"
                    defaultValue={String(u.can_submit_projects)}
                    className="h-9 text-xs"
                  >
                    <option value="false">Loyiha: Standart</option>
                    <option value="true">Loyiha: Ruxsat bor</option>
                  </Select>
                </div>
                <div className="lg:col-span-2 flex flex-wrap justify-end gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="Parolni tiklash"
                    onClick={() => {
                      setResetTarget({ id: u.id, name: `${u.first_name} ${u.last_name}` });
                      setNewPassword("");
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-rose-500 hover:text-rose-600"
                    title="Profilni butunlay o‘chirish"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "user",
                        id: u.id,
                        label: `${u.first_name} ${u.last_name} (${u.phone_e164 || "profil"})`,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="submit" size="sm" variant="primary" disabled={isPending}>
                    Saqlash
                  </Button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      )}

      {/* 3. LOYIHALAR MODERATSIYASI VA ISTALGAN HOLATGA O'TKAZISH */}
      {tab === "projects" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">
            Barcha loyihalarni boshqarish va moderatsiya ({projects.length})
          </h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <form
                key={p.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  runAction(() => adminUpdateProjectAction(fd));
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
              >
                <input type="hidden" name="project_id" value={p.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-display text-base font-bold">{p.title}</div>
                    <div className="text-xs text-slate-500">
                      {p.school ? `${p.school.school_number}-maktab` : ""} • {p.direction?.name} • Ovozlar: {p.votes_count}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-500"
                    onClick={() =>
                      setDeleteConfirm({ type: "project", id: p.id, label: p.title })
                    }
                  >
                    <Trash2 className="h-4 w-4" /> O‘chirish
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <Label className="text-xs">Holati (10 bosqich)</Label>
                    <Select name="status" defaultValue={p.status} className="h-9 text-xs">
                      {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {PROJECT_STATUS_META[st].label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Ovoz berish haftasi</Label>
                    <Select name="voting_week_id" defaultValue={p.voting_week_id || ""} className="h-9 text-xs">
                      <option value="">Biriktirilmagan</option>
                      {votingWeeks.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.week_code} — {w.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Bajarilish %</Label>
                    <Input
                      name="progress_percent"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={p.progress_percent}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Moderator izohi</Label>
                    <Input
                      name="moderation_note"
                      defaultValue={p.moderation_note || ""}
                      placeholder="Izoh..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" variant="primary" disabled={isPending}>
                  Loyihani yangilash
                </Button>
              </form>
            ))}
          </div>
        </Card>
      )}

      {/* 4. HAFTALIK OVOZ BERISH SIKLI */}
      {tab === "voting" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Yangi ovoz berish haftasini ochish</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                runAction(async () => {
                  const res = await adminCreateVotingWeekAction(fd);
                  if (res.ok) form.reset();
                  return res;
                });
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <Label>Hafta kodi</Label>
                <Input name="week_code" required placeholder="2026-W48" />
              </div>
              <div>
                <Label>Sarlavha</Label>
                <Input name="title" required placeholder="48-hafta ovoz berishi" />
              </div>
              <div>
                <Label>Boshlanish</Label>
                <Input name="starts_at" type="datetime-local" required />
              </div>
              <div>
                <Label>Tugash</Label>
                <Input name="ends_at" type="datetime-local" required />
              </div>
              <div>
                <Label>Holat</Label>
                <Select name="status" defaultValue="active">
                  <option value="active">Faol (darhol ochish)</option>
                  <option value="upcoming">Rejalashtirilgan</option>
                </Select>
              </div>
              <div className="lg:col-span-5">
                <Button type="submit" variant="teal" size="sm" disabled={isPending}>
                  Ovoz berish haftasini yaratish
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-display text-base font-bold">Mavjud haftalar</h3>
            {votingWeeks.length === 0 && (
              <p className="text-sm text-slate-500">Hali ovoz berish haftalari yaratilmagan.</p>
            )}
            {votingWeeks.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {w.title} ({w.week_code}) — <Badge>{w.status}</Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatUzDate(w.starts_at, true)} → {formatUzDate(w.ends_at, true)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {w.status !== "active" && (
                    <Button
                      size="sm"
                      variant="teal"
                      disabled={isPending}
                      onClick={() => runAction(() => adminSetVotingWeekStatusAction(w.id, "active"))}
                    >
                      Faollashtirish
                    </Button>
                  )}
                  {w.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => runAction(() => adminSetVotingWeekStatusAction(w.id, "closed"))}
                    >
                      Yopish
                    </Button>
                  )}
                  {w.status !== "finalized" && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isPending}
                      onClick={() => runAction(() => adminFinalizeVotingWeekAction(w.id))}
                    >
                      Yakunlash (G‘olib)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-500"
                    disabled={isPending}
                    onClick={() =>
                      setDeleteConfirm({ type: "week", id: w.id, label: `${w.title} (${w.week_code})` })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* 5. 61 TA MAKTAB VA YO'NALISHLAR BOSHQARUVI */}
      {tab === "schools" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Maktab qo‘shish / tahrirlash (61 maktab)</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                runAction(() => adminUpsertSchoolAction(fd));
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Maktab raqami *</Label>
                  <Input name="school_number" type="number" min={1} required placeholder="1" />
                </div>
                <div className="col-span-2">
                  <Label>Rasmiy maktab nomi *</Label>
                  <Input name="name" required placeholder="1-sonli umumiy o‘rta ta’lim maktabi" />
                </div>
              </div>
              <div>
                <Label>Manzil</Label>
                <Input name="address" placeholder="Baliqchi tumani, ..." />
              </div>
              <div>
                <Label>Qisqa tavsif</Label>
                <Input name="description" placeholder="Maktab haqida..." />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                Maktabni saqlash / yangilash
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <Compass className="h-5 w-5 text-teal-500" />
              Yangi yo‘nalish qo‘shish
            </div>
            <p className="text-xs text-slate-500">
              Nizomdagi rasmiy 7 ta yo‘nalish saqlangan. Kelajakda qo‘shimcha yo‘nalish qo‘shilsa, uning guruhi ham avtomatik yaratiladi.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                runAction(async () => {
                  const res = await adminCreateDirectionAction(fd);
                  if (res.ok) form.reset();
                  return res;
                });
              }}
              className="space-y-3"
            >
              <div>
                <Label>Yo‘nalish nomi *</Label>
                <Input name="name" required placeholder="Masalan: Kitobxonlik" />
              </div>
              <div>
                <Label>Tavsif *</Label>
                <Input name="description" required placeholder="Yo‘nalish maqsadi..." />
              </div>
              <Button type="submit" variant="teal" size="sm" disabled={isPending}>
                Yo‘nalish yaratish
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* 6. REYTING MEZONLARI VA QAYTA HISOBLASH */}
      {tab === "rankings" && (
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">
                Faol maktablar reytingi mezonlari
              </h2>
              <p className="text-xs text-slate-500">
                Har bir ko‘rsatkich uchun ball vaznini o‘zgartiring va 61 ta maktab reytingini qayta hisoblang.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="teal"
                disabled={isPending}
                onClick={() => runAction(() => adminRecalculateRankingsAction("overall"))}
              >
                <RefreshCw className="h-4 w-4" /> Umumiy hisoblash
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => runAction(() => adminRecalculateRankingsAction("monthly"))}
              >
                Oylik hisoblash
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => runAction(() => adminRecalculateRankingsAction("weekly"))}
              >
                Haftalik hisoblash
              </Button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              runAction(() => adminUpdateRankingWeightsAction(fd));
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <Label>Yakunlangan loyiha balli</Label>
              <Input
                name="completed_projects_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.completed_projects_weight}
              />
            </div>
            <div>
              <Label>Jarayondagi loyiha balli</Label>
              <Input
                name="in_progress_projects_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.in_progress_projects_weight}
              />
            </div>
            <div>
              <Label>O‘tkazilgan tadbir balli</Label>
              <Input
                name="events_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.events_weight}
              />
            </div>
            <div>
              <Label>Topshirilgan hisobot balli</Label>
              <Input
                name="reports_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.reports_weight}
              />
            </div>
            <div>
              <Label>Faol yo‘nalishlar soni balli</Label>
              <Input
                name="direction_activity_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.direction_activity_weight}
              />
            </div>
            <div>
              <Label>Ishtirokchilar faolligi balli</Label>
              <Input
                name="participation_weight"
                type="number"
                step="0.5"
                defaultValue={rankingSettings.participation_weight}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                Mezonlarni saqlash
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 7. AUDIT LOG */}
      {tab === "audit" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">Tizim va Admin Audit Logi ({logs.length})</h2>
          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-bold text-blue-600 dark:text-sky-400">{l.action}</span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span className="font-medium">{l.entity_type}</span>
                    <span className="mx-2 text-slate-400">•</span>
                    <span>
                      {l.actor ? `${l.actor.first_name} ${l.actor.last_name}` : "Tizim"}
                    </span>
                  </div>
                  <span className="text-slate-500">{formatUzDate(l.created_at, true)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Hozircha audit yozuvlari yo‘q.</p>
          )}
        </Card>
      )}

      {/* Parolni tiklash modali */}
      <MotionModal
        open={Boolean(resetTarget)}
        onClose={() => !isPending && setResetTarget(null)}
        title="Foydalanuvchi parolini tiklash"
        description={
          resetTarget
            ? `${resetTarget.name} uchun yangi parol belgilang (kamida 8 belgi).`
            : undefined
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!resetTarget) return;
            runAction(async () => {
              const res = await adminResetUserPasswordAction(resetTarget.id, newPassword);
              if (res.ok) {
                setResetTarget(null);
                setNewPassword("");
              }
              return res;
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="admin_new_pwd">Yangi parol *</Label>
            <PasswordInput
              id="admin_new_pwd"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Kamida 8 ta belgi..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetTarget(null)}
              disabled={isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Parolni yangilash
            </Button>
          </div>
        </form>
      </MotionModal>

      {/* O'chirishni tasdiqlash modali */}
      <MotionModal
        open={Boolean(deleteConfirm)}
        onClose={() => !isPending && setDeleteConfirm(null)}
        title="O‘chirishni tasdiqlang"
        description={
          deleteConfirm
            ? `“${deleteConfirm.label}” yozuvi butunlay o‘chiriladi. Ushbu amalni ortga qaytarib bo‘lmaydi.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirm(null)}
            disabled={isPending}
          >
            Bekor qilish
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (!deleteConfirm) return;
              const target = deleteConfirm;
              runAction(async () => {
                const res =
                  target.type === "project"
                    ? await adminDeleteProjectAction(target.id)
                    : target.type === "user"
                    ? await adminDeleteUserAction(target.id)
                    : await adminDeleteVotingWeekAction(target.id);
                if (res.ok) setDeleteConfirm(null);
                return res;
              });
            }}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Ha, o‘chirish
          </Button>
        </div>
      </MotionModal>
    </div>
  );
}
