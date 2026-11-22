"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Input, Label, Select, Textarea } from "@/core/ui/primitives/fields";
import { MotionModal } from "@/core/ui/shared/motion-primitives";
import { updateOwnProfileAction } from "@/modules/accounts/actions";
import type { UserProfile } from "@/core/types/database";

export function ProfileEditButton({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateOwnProfileAction(fd);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-white/25 bg-white/10 text-white hover:bg-white/20"
      >
        <Pencil className="h-3.5 w-3.5" />
        Profilni tahrirlash
      </Button>

      <MotionModal
        open={open}
        onClose={() => !isPending && setOpen(false)}
        title="Shaxsiy profilni tahrirlash"
        description="Ism, familiya, sinf va qisqa bio ma’lumotlaringizni yangilang."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit_fn">Ism *</Label>
              <Input id="edit_fn" name="first_name" defaultValue={user.first_name} required />
            </div>
            <div>
              <Label htmlFor="edit_ln">Familiya *</Label>
              <Input id="edit_ln" name="last_name" defaultValue={user.last_name} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit_grade">Sinf (5–11)</Label>
              <Select id="edit_grade" name="grade" defaultValue={user.grade ? String(user.grade) : ""}>
                <option value="">Ko‘rsatilmagan</option>
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>{g}-sinf</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_letter">Sinf harfi</Label>
              <Input
                id="edit_letter"
                name="class_letter"
                defaultValue={user.class_letter || ""}
                placeholder="A, B, V..."
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit_bio">O‘zingiz haqingizda (bio)</Label>
            <Textarea
              id="edit_bio"
              name="bio"
              defaultValue={user.bio || ""}
              placeholder="Qiziqishlaringiz, yo‘nalishingiz yoki maqsadlaringiz..."
              maxLength={400}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </Button>
          </div>
        </form>
      </MotionModal>
    </>
  );
}
