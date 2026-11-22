"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import { Input, Label, Select, Textarea } from "@/core/ui/primitives/fields";
import { createProjectAction } from "@/modules/projects/actions";
import type { Direction, School } from "@/core/types/database";

export function ProjectCreateForm({
  directions,
  schools,
  defaultSchoolId,
  authorName,
}: {
  directions: Direction[];
  schools: School[];
  defaultSchoolId?: string | null;
  authorName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitMode, setSubmitMode] = useState<"submit" | "draft">("submit");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("submit_immediately", submitMode === "submit" ? "true" : "false");

    startTransition(async () => {
      const res = await createProjectAction(formData);
      if (res.ok) {
        toast.success(res.message);
        if (res.redirectTo) router.push(res.redirectTo);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 1. Loyiha nomi */}
            <div className="md:col-span-2">
              <Label htmlFor="title">1. Loyiha nomi *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Masalan: Maktab kutubxonasini raqamlashtirish va elektron katalog yaratish"
              />
            </div>

            {/* 2. Yo'nalish */}
            <div>
              <Label htmlFor="direction_id">2. Rasmiy yo‘nalish *</Label>
              <Select id="direction_id" name="direction_id" required defaultValue="">
                <option value="" disabled>Yo‘nalishni tanlang...</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* 3. Maktab */}
            <div>
              <Label htmlFor="school_id">3. Maktab (61 ta maktabdan) *</Label>
              <Select
                id="school_id"
                name="school_id"
                required
                defaultValue={defaultSchoolId || ""}
              >
                <option value="" disabled>Maktabni tanlang...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.school_number}-maktab — {s.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* 4. Muallif (avtomatik) */}
            <div>
              <Label>4. Muallif</Label>
              <Input value={authorName} disabled />
            </div>

            {/* 11. Amalga oshirish muddati */}
            <div>
              <Label htmlFor="duration_text">11. Amalga oshirish muddati *</Label>
              <Input
                id="duration_text"
                name="duration_text"
                required
                placeholder="Masalan: 3 hafta / 2 oy"
              />
            </div>
          </div>

          {/* 5. Muammo va dolzarblik */}
          <div>
            <Label htmlFor="problem_statement">5. Muammo va dolzarblik *</Label>
            <Textarea
              id="problem_statement"
              name="problem_statement"
              required
              placeholder="Maktab yoki tuman o‘quvchilari duch kelayotgan aniq muammo nima va u nima uchun dolzarb?"
            />
          </div>

          {/* 6. Loyihaning maqsadi */}
          <div>
            <Label htmlFor="goal">6. Loyihaning maqsadi *</Label>
            <Textarea
              id="goal"
              name="goal"
              required
              placeholder="Loyiha orqali erishiladigan asosiy maqsadni aniq ifodalang."
            />
          </div>

          {/* 7. Taklif qilinayotgan yechim */}
          <div>
            <Label htmlFor="proposed_solution">7. Taklif qilinayotgan yechim *</Label>
            <Textarea
              id="proposed_solution"
              name="proposed_solution"
              required
              placeholder="Muammoni qanday amaliy yechim orqali hal qilmoqchisiz?"
            />
          </div>

          {/* 8. Amalga oshirish rejasi */}
          <div>
            <Label htmlFor="implementation_plan">8. Amalga oshirish rejasi (bosqichma-bosqich) *</Label>
            <Textarea
              id="implementation_plan"
              name="implementation_plan"
              required
              placeholder="1-bosqich: ...&#10;2-bosqich: ...&#10;3-bosqich: ..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 9. Kutilayotgan natija */}
            <div>
              <Label htmlFor="expected_result">9. Kutilayotgan natija *</Label>
              <Textarea
                id="expected_result"
                name="expected_result"
                required
                placeholder="Loyiha yakunida qanday o‘lchanadigan natija bo‘ladi?"
              />
            </div>

            {/* 10. Kerakli resurslar */}
            <div>
              <Label htmlFor="required_resources">10. Kerakli resurslar *</Label>
              <Textarea
                id="required_resources"
                name="required_resources"
                required
                placeholder="Jamoa, jihozlar, maydon yoki ko‘mak turlari..."
              />
            </div>
          </div>

          {/* 12. Loyiha rasmi yoki videosi */}
          <div>
            <Label htmlFor="cover_image_url">12. Loyiha rasmi yoki video havolasi (ixtiyoriy)</Label>
            <Input
              id="cover_image_url"
              name="cover_image_url"
              type="url"
              placeholder="https://... (Supabase Storage yoki rasmiy media havolasi)"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => setSubmitMode("draft")}
            >
              <Save className="h-4 w-4" />
              Qoralama sifatida saqlash
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              onClick={() => setSubmitMode("submit")}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Moderatsiyaga yuborish
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
