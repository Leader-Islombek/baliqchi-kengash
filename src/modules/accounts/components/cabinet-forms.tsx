"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CheckCircle2,
  FileSpreadsheet,
  Inbox,
  Lightbulb,
  Loader2,
  Megaphone,
  Plus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Input, Label, Select, Textarea } from "@/core/ui/primitives/fields";
import {
  createAnnouncementAction,
  createEventAction,
  reviewInitiativeAction,
  submitInitiativeAction,
  submitReportAction,
} from "@/modules/projects/actions";
import { formatUzDate } from "@/core/utils";
import type { Direction, School } from "@/core/types/database";
import type { StudentInitiativeItem } from "@/core/db/queries";

export function StudentInitiativeForm({ directions }: { directions: Direction[] }) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await submitInitiativeAction(fd);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 font-display text-base font-bold mb-1">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        Maktab Kelajak Lideriga tashabbus yuborish
      </div>
      <p className="text-xs text-slate-500 mb-4">
        G‘oyangizni yuboring — maktabingiz Kengashi uni rasmiy loyihaga aylantirib, haftalik ovoz berishga chiqarishi mumkin.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="init_title">Tashabbus nomi</Label>
            <Input id="init_title" name="title" required placeholder="Qisqa va aniq nom..." />
          </div>
          <div>
            <Label htmlFor="init_dir">Yo‘nalish</Label>
            <Select id="init_dir" name="direction_id" required defaultValue="">
              <option value="" disabled>Yo‘nalishni tanlang...</option>
              {directions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="init_prob">Muammo nimada?</Label>
          <Input id="init_prob" name="problem_summary" required placeholder="Qaysi muammoni hal qiladi?" />
        </div>
        <div>
          <Label htmlFor="init_details">Taklif tafsilotlari</Label>
          <Textarea id="init_details" name="idea_details" required placeholder="G‘oyangizni batafsil yozing..." />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Tashabbusni yuborish
        </Button>
      </form>
    </Card>
  );
}

export function ActivityReportForm({
  directions,
  schoolId,
}: {
  directions: Direction[];
  schoolId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (schoolId) fd.set("school_id", schoolId);
    startTransition(async () => {
      const res = await submitReportAction(fd);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 font-display text-base font-bold mb-4">
        <FileSpreadsheet className="h-5 w-5 text-teal-500" />
        Haftalik / Choraklik faoliyat hisobotini topshirish
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="rep_period">Hisobot davri</Label>
            <Input id="rep_period" name="period_label" required placeholder="Masalan: 2026-yil 4-hafta" />
          </div>
          <div>
            <Label htmlFor="rep_dir">Yo‘nalish (ixtiyoriy)</Label>
            <Select id="rep_dir" name="direction_id" defaultValue="">
              <option value="">Umumiy Kengash hisoboti</option>
              {directions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="rep_sum">Bajarilgan ishlar va natijalar</Label>
          <Textarea id="rep_sum" name="summary" required placeholder="O‘tkazilgan tadbirlar, ishtirokchilar soni va natijalar..." />
        </div>
        <Button type="submit" variant="teal" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Hisobotni yuborish
        </Button>
      </form>
    </Card>
  );
}

export function QuickEventForm({
  directions,
  schools,
  defaultSchoolId,
}: {
  directions: Direction[];
  schools: School[];
  defaultSchoolId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createEventAction(fd);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 font-display text-base font-bold mb-4">
        <CalendarPlus className="h-5 w-5 text-blue-500" />
        Yangi tadbir joylash
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="ev_title">Tadbir nomi</Label>
            <Input id="ev_title" name="title" required placeholder="Masalan: Eko-maktab ko‘chat ekish aksiyasi" />
          </div>
          <div>
            <Label htmlFor="ev_loc">O‘tkazilish joyi</Label>
            <Input id="ev_loc" name="location" required placeholder="Maktab hovlisi / Tuman markazi" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="ev_start">Sana va vaqt</Label>
            <Input id="ev_start" name="starts_at" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="ev_school">Maktab (Tuman uchun bo‘sh)</Label>
            <Select id="ev_school" name="school_id" defaultValue={defaultSchoolId || ""}>
              <option value="">Tuman miqyosida</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.school_number}-maktab</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ev_dir">Yo‘nalish</Label>
            <Select id="ev_dir" name="direction_id" defaultValue="">
              <option value="">Umumiy</option>
              {directions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="ev_desc">Tadbir tavsifi</Label>
          <Textarea id="ev_desc" name="description" required placeholder="Dastur, maqsad va qatnashchilar..." />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Tadbirni e’lon qilish
        </Button>
      </form>
    </Card>
  );
}

export function QuickAnnouncementForm({
  schools,
  defaultSchoolId,
}: {
  schools: School[];
  defaultSchoolId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createAnnouncementAction(fd);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 font-display text-base font-bold mb-4">
        <Megaphone className="h-5 w-5 text-indigo-500" />
        Yangilik / Umumiy e’lon joylash
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="an_title">Sarlavha</Label>
            <Input id="an_title" name="title" required placeholder="Yangilik sarlavhasi..." />
          </div>
          <div>
            <Label htmlFor="an_school">Qamrov</Label>
            <Select id="an_school" name="school_id" defaultValue={defaultSchoolId || ""}>
              <option value="">Butun tuman (61 maktab)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.school_number}-maktab</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="an_content">To‘liq matn</Label>
          <Textarea id="an_content" name="content" required placeholder="Yangilik yoki e’lon mazmunini yozing..." />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          E’lon qilish
        </Button>
      </form>
    </Card>
  );
}

const INITIATIVE_STATUS_META: Record<string, { label: string; badge: string }> = {
  new: { label: "Yangi", badge: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300" },
  reviewing: { label: "Ko‘rib chiqilmoqda", badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  accepted: { label: "Qabul qilindi", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  converted: { label: "Loyihaga aylantirilgan", badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  declined: { label: "Rad etildi", badge: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300" },
};

export function SchoolInitiativesInbox({
  initiatives,
  canReview,
  title = "O‘quvchilardan kelgan tashabbuslar",
}: {
  initiatives: StudentInitiativeItem[];
  canReview: boolean;
  title?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatus(id: string, status: "accepted" | "declined") {
    startTransition(async () => {
      const res = await reviewInitiativeAction(id, status);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-base font-bold">
          <Inbox className="h-5 w-5 text-[#4F46E5] dark:text-[#22D3EE]" />
          {title} ({initiatives.length})
        </div>
        <Link href="/loyihalar/yangi">
          <Button variant="teal" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Rasmiy loyiha yaratish
          </Button>
        </Link>
      </div>

      <p className="text-xs text-[#5B677F] dark:text-slate-400">
        Maktabingiz o‘quvchilari yuborgan g‘oya va takliflarni ko‘rib chiqing hamda eng yaxshilarini rasmiy loyiha sifatida joylang.
      </p>

      {initiatives.length > 0 ? (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {initiatives.map((item) => {
            const st = INITIATIVE_STATUS_META[item.status] || INITIATIVE_STATUS_META.new;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#DCE5F5] dark:border-[#233566] bg-[#F4F7FF]/60 dark:bg-[#060B19]/60 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-display text-sm font-bold text-[#111827] dark:text-white">
                    {item.title}
                  </div>
                  <Badge className={st.badge}>{st.label}</Badge>
                </div>
                <div className="text-xs text-[#5B677F] dark:text-slate-400">
                  {item.author
                    ? `${item.author.first_name} ${item.author.last_name}${item.author.grade ? ` (${item.author.grade}-sinf)` : ""}`
                    : "O‘quvchi"}{" "}
                  • {item.direction?.name || "Yo‘nalish"}
                  {item.school ? ` • ${item.school.school_number}-maktab` : ""} •{" "}
                  {formatUzDate(item.created_at)}
                </div>
                <p className="text-xs text-[#111827] dark:text-slate-300">
                  <strong>Muammo:</strong> {item.problem_summary}
                </p>
                <p className="text-xs text-[#5B677F] dark:text-slate-400 whitespace-pre-wrap">
                  {item.idea_details}
                </p>

                {canReview && item.status !== "accepted" && item.status !== "declined" && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="teal"
                      disabled={isPending}
                      onClick={() => handleStatus(item.id, "accepted")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Qabul qilish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                      disabled={isPending}
                      onClick={() => handleStatus(item.id, "declined")}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Rad etish
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#CBD7EE] dark:border-[#233566] p-6 text-center text-xs text-[#5B677F] dark:text-slate-400">
          Hozircha o‘quvchilardan yangi tashabbus kelib tushmagan.
        </div>
      )}
    </Card>
  );
}
