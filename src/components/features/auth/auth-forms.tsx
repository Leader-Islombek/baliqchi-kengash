"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/fields";
import { loginAction, registerStudentAction } from "@/actions/auth";
import type { Direction, School } from "@/types/database";

export function RegisterForm({
  schools,
  directions,
}: {
  schools: School[];
  directions: Direction[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requestedRole, setRequestedRole] = useState("student");

  const needsDirection =
    requestedRole === "school_coordinator" || requestedRole === "district_coordinator";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await registerStudentAction(formData);
      if (res.ok) {
        toast.success(res.message);
        router.push(res.redirectTo || "/kabinet");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Yangi hisob yaratish
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Telefon raqamingiz maxfiy saqlanadi va ommaviy sahifalarda hech qachon ko‘rsatilmaydi.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Ism *</Label>
              <Input id="first_name" name="first_name" required placeholder="Ismingiz" />
            </div>
            <div>
              <Label htmlFor="last_name">Familiya *</Label>
              <Input id="last_name" name="last_name" required placeholder="Familiyangiz" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="school_id">Maktab (61 ta maktabdan tanlang) *</Label>
              <Select id="school_id" name="school_id" required defaultValue="">
                <option value="" disabled>Maktabingizni tanlang...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.school_number}-maktab — {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="grade">Sinf (5–11) *</Label>
              <Select id="grade" name="grade" required defaultValue="9">
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}-sinf
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefon raqami (Login uchun) *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+998 90 123 45 67"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">Parol (kamida 8 belgi) *</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm_password">Parolni tasdiqlang *</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Maxsus rolga ariza opsiyasi */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
            <div>
              <Label htmlFor="requested_role">Platformadagi maqomingiz</Label>
              <Select
                id="requested_role"
                name="requested_role"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
              >
                <option value="student">Oddiy o‘quvchi (darhol faollashadi)</option>
                <option value="school_coordinator">Maktab yo‘nalish koordinatori (Admin tasdig‘i bilan)</option>
                <option value="school_leader">Maktab Kelajak Lideri (Admin tasdig‘i bilan)</option>
                <option value="district_coordinator">Tuman yo‘nalish koordinatori (Admin tasdig‘i bilan)</option>
                <option value="district_leader">Tuman Kelajak Lideri (Admin tasdig‘i bilan)</option>
                <option value="school_advisor">Maktab maslahatchisi (Admin tasdig‘i bilan)</option>
              </Select>
            </div>

            {needsDirection && (
              <div>
                <Label htmlFor="requested_direction_id">Qaysi yo‘nalish koordinatorisiz? *</Label>
                <Select id="requested_direction_id" name="requested_direction_id" required defaultValue="">
                  <option value="" disabled>7 ta yo‘nalishdan tanlang...</option>
                  {directions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {requestedRole !== "student" && (
              <div>
                <Label htmlFor="request_note">Tasdiqlash uchun qisqa izoh</Label>
                <Textarea
                  id="request_note"
                  name="request_note"
                  placeholder="Saylangan sanangiz yoki mas’ul lavozimingiz haqida qisqacha ma’lumot..."
                  className="min-h-[70px]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
            <span>Har bir o‘quvchi faqat bitta akkaunt orqali haftasiga 1 ta ovoz bera oladi.</span>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Ro‘yxatdan o‘tish
          </Button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Allaqachon akkauntingiz bormi?{" "}
            <Link href="/kirish" className="font-semibold text-blue-600 dark:text-sky-400 hover:underline">
              Tizimga kirish
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (redirectTo) formData.set("redirect", redirectTo);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.ok) {
        toast.success(res.message);
        router.push(res.redirectTo || "/kabinet");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Tizimga kirish
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ro‘yxatdan o‘tgan telefon raqamingiz va parolingizni kiriting.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login_phone">Telefon raqami</Label>
            <Input
              id="login_phone"
              name="phone"
              type="tel"
              required
              placeholder="+998 90 123 45 67"
            />
          </div>
          <div>
            <Label htmlFor="login_password">Parol</Label>
            <Input id="login_password" name="password" type="password" required />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Kirish
          </Button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Hali ro‘yxatdan o‘tmaganmisiz?{" "}
            <Link
              href="/royxatdan-otish"
              className="font-semibold text-blue-600 dark:text-sky-400 hover:underline"
            >
              Ro‘yxatdan o‘tish
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
