"use client";

import { useTransition } from "react";
import { Loader2, Paperclip, Pin, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/fields";
import {
  deleteGroupMessageAction,
  sendGroupMessageAction,
  togglePinGroupMessageAction,
} from "@/actions/groups";
import { formatUzDate } from "@/lib/utils";
import type { GroupMessage } from "@/types/database";

const TYPE_META: Record<string, { label: string; badge: string }> = {
  message: { label: "Muhokama", badge: "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300" },
  announcement: { label: "E’lon", badge: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-sky-400" },
  task: { label: "Topshiriq", badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  report: { label: "Hisobot", badge: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300" },
};

export function GroupWorkspace({
  groupId,
  messages,
  currentUserId,
  canManageGroup,
}: {
  groupId: string;
  messages: GroupMessage[];
  currentUserId: string;
  canManageGroup: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("group_id", groupId);
    startTransition(async () => {
      const res = await sendGroupMessageAction(fd);
      if (res.ok) {
        toast.success(res.message);
        form.reset();
      } else {
        toast.error(res.message);
      }
    });
  }

  function handlePin(id: string, pinned: boolean) {
    startTransition(async () => {
      const res = await togglePinGroupMessageAction(id, !pinned);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteGroupMessageAction(id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  return (
    <div className="space-y-6">
      {/* Xabar / E'lon / Topshiriq yuborish */}
      <Card className="p-6">
        <h3 className="font-display text-base font-bold mb-4">
          Yangi xabar, e’lon yoki topshiriq joylash
        </h3>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="msg_type">Turi</Label>
              <Select id="msg_type" name="message_type" defaultValue="message">
                <option value="message">Muhokama xabari</option>
                <option value="announcement">Umumiy e’lon</option>
                <option value="task">Topshiriq</option>
                <option value="report">Faoliyat hisoboti</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="msg_title">Sarlavha (ixtiyoriy)</Label>
              <Input id="msg_title" name="title" placeholder="Masalan: Haftalik yig‘ilish rejasi" />
            </div>
          </div>

          <div>
            <Label htmlFor="msg_content">Xabar matni *</Label>
            <Textarea id="msg_content" name="content" required placeholder="Guruh a’zolariga xabaringizni yozing..." />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="att_url">Fayl / hujjat havolasi (ixtiyoriy)</Label>
              <Input id="att_url" name="attachment_url" type="url" placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="att_name">Fayl nomi</Label>
              <Input id="att_name" name="attachment_name" placeholder="Masalan: Haftalik_reja.pdf" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {canManageGroup ? (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" name="is_pinned" value="true" className="rounded" />
                Muhim xabar sifatida tepaga mahkamlash (Pin)
              </label>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Yuborish
            </Button>
          </div>
        </form>
      </Card>

      {/* Xabarlar lentasi */}
      <div className="space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const tm = TYPE_META[msg.message_type] || TYPE_META.message;
            const canModify = canManageGroup || msg.author_id === currentUserId;
            return (
              <Card
                key={msg.id}
                className={`p-5 ${msg.is_pinned ? "border-blue-500/40 bg-blue-500/[0.03]" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={tm.badge}>{tm.label}</Badge>
                    {msg.is_pinned && (
                      <Badge className="border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        <Pin className="h-3 w-3" /> Mahkamlangan
                      </Badge>
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {msg.author ? `${msg.author.first_name} ${msg.author.last_name}` : "A’zo"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatUzDate(msg.created_at, true)}
                    </span>
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-1">
                      {canManageGroup && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePin(msg.id, msg.is_pinned)}
                          title="Pin / Unpin"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(msg.id)}
                        className="text-rose-500 hover:text-rose-600"
                        title="O‘chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {msg.title && (
                  <h4 className="mt-2 font-display text-base font-bold text-slate-900 dark:text-white">
                    {msg.title}
                  </h4>
                )}
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {msg.content}
                </p>

                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-sm text-slate-500">
            Guruhda hali xabarlar yo‘q. Birinchi e’lon yoki muhokamani boshlang!
          </Card>
        )}
      </div>
    </div>
  );
}
