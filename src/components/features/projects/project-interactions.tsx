"use client";

import { useTransition } from "react";
import { Loader2, MessageSquare, PlusCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { addCommentAction, addProjectUpdateAction } from "@/actions/projects";
import { formatUzDate } from "@/lib/utils";
import type { CommentItem } from "@/types/database";

export function ProjectCommentsSection({
  projectId,
  comments,
  isAuthenticated,
}: {
  projectId: string;
  comments: CommentItem[];
  isAuthenticated: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("project_id", projectId);

    startTransition(async () => {
      const res = await addCommentAction(formData);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        Muhokama va izohlar ({comments.length})
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleComment} className="space-y-3">
          <Textarea
            name="content"
            required
            placeholder="Loyiha bo‘yicha fikringiz, taklifingiz yoki savolingizni yozing..."
            className="min-h-[84px]"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Izoh qoldirish
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl bg-slate-100 dark:bg-slate-800/70 p-3.5 text-sm text-slate-600 dark:text-slate-300">
          Izoh qoldirish uchun tizimga kiring.
        </p>
      )}

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {c.user ? `${c.user.first_name} ${c.user.last_name}` : "O‘quvchi"}
                  {c.user?.grade ? ` (${c.user.grade}-sinf)` : ""}
                </span>
                <span>{formatUzDate(c.created_at, true)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Hali izohlar yo‘q. Birinchi bo‘lib fikr bildiring!</p>
        )}
      </div>
    </Card>
  );
}

export function ProjectUpdateForm({
  projectId,
  currentProgress,
}: {
  projectId: string;
  currentProgress: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("project_id", projectId);

    startTransition(async () => {
      const res = await addProjectUpdateAction(formData);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Card className="p-6 border-teal-500/30">
      <div className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white mb-4">
        <PlusCircle className="h-5 w-5 text-teal-500" />
        Haftalik jarayon yangilanishini qo‘shish
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="upd_title">Yangilanish sarlavhasi *</Label>
            <Input id="upd_title" name="title" required placeholder="Masalan: 1-bosqich yakunlandi" />
          </div>
          <div>
            <Label htmlFor="progress_percent">Bajarilish foizi (0–100%) *</Label>
            <Input
              id="progress_percent"
              name="progress_percent"
              type="number"
              min={0}
              max={100}
              defaultValue={currentProgress}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="upd_content">Bajarilgan ishlar tafsiloti *</Label>
          <Textarea id="upd_content" name="content" required placeholder="Nimalar amalga oshirildi?" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="results_achieved">Erishilgan natijalar</Label>
            <Input id="results_achieved" name="results_achieved" placeholder="Aniq ko‘rsatkichlar..." />
          </div>
          <div>
            <Label htmlFor="challenges">Mavjud muammolar (bo‘lsa)</Label>
            <Input id="challenges" name="challenges" placeholder="Qiyinchiliklar yoki kerakli ko‘mak..." />
          </div>
        </div>
        <div>
          <Label htmlFor="media_url">Foto / Video havolasi (ixtiyoriy)</Label>
          <Input id="media_url" name="media_url" type="url" placeholder="https://..." />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="teal" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Jarayonni yangilash
          </Button>
        </div>
      </form>
    </Card>
  );
}
