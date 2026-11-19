"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/groups";
import { formatUzDate } from "@/lib/utils";
import type { NotificationItem } from "@/types/database";

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  const [isPending, startTransition] = useTransition();

  function markOne(id: string) {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.ok) toast.success(res.message);
    });
  }

  function markAll() {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.ok) toast.success(res.message);
    });
  }

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={isPending}>
            <CheckCheck className="h-4 w-4" />
            Barchasini o‘qilgan deb belgilash ({unreadCount})
          </Button>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`p-5 ${
                n.is_read ? "opacity-80" : "border-blue-500/40 bg-blue-500/[0.04]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className={`h-4 w-4 ${n.is_read ? "text-slate-400" : "text-blue-600"}`} />
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                  <div className="text-xs text-slate-400">{formatUzDate(n.created_at, true)}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link_url && (
                    <Link href={n.link_url}>
                      <Button variant="outline" size="sm">Ko‘rish</Button>
                    </Link>
                  )}
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markOne(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center text-sm text-slate-500">
          Sizda hozircha bildirishnomalar yo‘q.
        </Card>
      )}
    </div>
  );
}
