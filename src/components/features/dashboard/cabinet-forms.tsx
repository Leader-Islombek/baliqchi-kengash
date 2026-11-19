"use client";

import { useTransition } from "react";
import { CalendarPlus, FileSpreadsheet, Lightbulb, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/fields";
import {
  createAnnouncementAction,
  createEventAction,
  submitInitiativeAction,
  submitReportAction,
} from "@/actions/projects";
import type { Direction, School } from "@/types/database";

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
