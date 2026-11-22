"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, Loader2, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import { Input, Label, PasswordInput, Select, Textarea } from "@/core/ui/primitives/fields";
import { MotionModal } from "@/core/ui/shared/motion-primitives";
import { loginAction, registerStudentAction } from "@/modules/accounts/actions";
import type { Direction, School } from "@/core/types/database";

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
    <Card className="mx-auto max-w-2xl rounded-3xl">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white shadow-md shadow-[#2563EB]/25">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#172033] dark:text-white">
              Yangi hisob yaratish
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
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
              <PasswordInput id="password" name="password" required minLength={8} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="confirm_password">Parolni tasdiqlang *</Label>
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/60 p-4 space-y-3">
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

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" />
            <span>Har bir o‘quvchi faqat bitta akkaunt orqali haftasiga 1 ta ovoz bera oladi.</span>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Ro‘yxatdan o‘tish
          </Button>

          <p className="text-center text-sm text-[#64748B] dark:text-slate-400">
            Allaqachon akkauntingiz bormi?{" "}
            <Link href="/kirish" className="font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline">
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
  const [recoveryOpen, setRecoveryOpen] = useState(false);

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
    <>
      <Card className="mx-auto max-w-md rounded-3xl">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-[#2563EB]/25">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#172033] dark:text-white">
                Tizimga kirish
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
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
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="login_password" className="mb-0">
                  Parol
                </Label>
                <button
                  type="button"
                  onClick={() => setRecoveryOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Parolni unutdingizmi?
                </button>
              </div>
              <PasswordInput id="login_password" name="password" required placeholder="••••••••" />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirish
            </Button>

            <p className="text-center text-sm text-[#64748B] dark:text-slate-400">
              Hali ro‘yxatdan o‘tmaganmisiz?{" "}
              <Link
                href="/royxatdan-otish"
                className="font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
              >
                Ro‘yxatdan o‘tish
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <MotionModal
        open={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        title="Parolni tiklash tartibi"
        description="Voyaga yetmagan o‘quvchilar hisobi xavfsizligi uchun parolni tiklash tasdiqlangan mas’ul orqali amalga oshiriladi."
      >
        <div className="space-y-3 text-sm text-[#172033] dark:text-slate-300 leading-relaxed">
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224] p-4 space-y-2">
            <p>
              <strong>1-qadam:</strong> O‘z maktabingizdagi <strong>Maktab Kelajak Lideri</strong> yoki{" "}
              <strong>Tuman Super Administratori</strong>ga telefon raqamingiz va maktabingizni ma’lum qiling.
            </p>
            <p>
              <strong>2-qadam:</strong> Administrator <strong>Admin Panel → Foydalanuvchilar</strong> bo‘limidan siz uchun vaqtinchalik yangi parol o‘rnatib beradi.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setRecoveryOpen(false)}>
              Tushunarli
            </Button>
          </div>
        </div>
      </MotionModal>
    </>
  );
}
