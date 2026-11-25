"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  BellRing,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Input, Label, Select, Textarea } from "@/core/ui/primitives/fields";
import {
  adminAddRequiredChannelAction,
  adminAddTelegramBotAdminAction,
  adminDeleteRequiredChannelAction,
  adminRemoveTelegramBotAdminAction,
  adminSyncTelegramWebhookAction,
  adminToggleRequiredChannelAction,
  adminToggleTelegramUserBanAction,
  adminUpdateTelegramSettingsAction,
  adminVerifyRequiredChannelAction,
} from "@/modules/telegram-admin/actions";
import type { TelegramBotAdminOverview } from "@/modules/telegram-admin/queries";
import type { School } from "@/core/types/database";
import { formatUzDate } from "@/core/utils";

type SubSection = "channels" | "broadcast" | "settings" | "users";

export function TelegramAdminPanel({
  data,
  schools,
}: {
  data: TelegramBotAdminOverview;
  schools: School[];
}) {
  const router = useRouter();
  const [sub, setSub] = useState<SubSection>("channels");
  const [isPending, startTransition] = useTransition();

  // Broadcast state (batch loop with live progress bar)
  const [audience, setAudience] = useState<"all" | "registered" | "unregistered" | "school">("all");
  const [schoolId, setSchoolId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    done: boolean;
  } | null>(null);

  // Settings local controlled toggles
  const [requireSub, setRequireSub] = useState(data.settings.require_subscription);
  const [notifyRoles, setNotifyRoles] = useState(data.settings.notify_role_updates);
  const [notifyProjects, setNotifyProjects] = useState(data.settings.notify_project_updates);
  const [notifyVoting, setNotifyVoting] = useState(data.settings.notify_voting_weeks);
  const [maintenanceMode, setMaintenanceMode] = useState(data.settings.maintenance_mode);

  // Users search
  const [userSearch, setUserSearch] = useState("");

  function runAction(fn: () => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        onSuccess?.();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  async function handleStartBroadcast(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (broadcasting) return;

    setBroadcasting(true);
    setBroadcastProgress(null);

    try {
      const startRes = await fetch("/api/admin/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "start",
          audience,
          school_id: audience === "school" ? schoolId : null,
          message_text: messageText,
          photo_url: photoUrl || null,
          button_text: buttonText || null,
          button_url: buttonUrl || null,
        }),
      });
      const startJson = (await startRes.json()) as {
        ok: boolean;
        message?: string;
        broadcastId?: string;
        totalTargets?: number;
      };

      if (!startJson.ok || !startJson.broadcastId || !startJson.totalTargets) {
        toast.error(startJson.message || "Rassilkani boshlashda xatolik.");
        setBroadcasting(false);
        return;
      }

      const broadcastId = startJson.broadcastId;
      const total = startJson.totalTargets;
      setBroadcastProgress({ total, sent: 0, failed: 0, done: false });

      let afterTelegramId = 0;
      let done = false;
      let sent = 0;
      let failed = 0;

      while (!done) {
        const batchRes = await fetch("/api/admin/telegram/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "batch",
            broadcastId,
            afterTelegramId,
            batchSize: 20,
          }),
        });
        const batchJson = (await batchRes.json()) as {
          ok: boolean;
          message?: string;
          done?: boolean;
          totalSent?: number;
          totalFailed?: number;
          nextAfterTelegramId?: number;
        };

        if (!batchJson.ok) {
          toast.error(batchJson.message || "Xabar yuborishda uzilish yuz berdi.");
          break;
        }

        sent = batchJson.totalSent ?? sent;
        failed = batchJson.totalFailed ?? failed;
        afterTelegramId = batchJson.nextAfterTelegramId ?? afterTelegramId;
        done = Boolean(batchJson.done);

        setBroadcastProgress({ total, sent, failed, done });
      }

      toast.success(`Rassilka yakunlandi! Yetkazildi: ${sent}, xato/bloklagan: ${failed}.`);
      setMessageText("");
      setPhotoUrl("");
      setButtonText("");
      setButtonUrl("");
      router.refresh();
    } catch {
      toast.error("Tarmoq xatoligi yuz berdi.");
    } finally {
      setBroadcasting(false);
    }
  }

  const filteredBotUsers = data.botUsers.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.telegram_user_id).includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q) ||
      (u.linked_user?.first_name || "").toLowerCase().includes(q) ||
      (u.linked_user?.last_name || "").toLowerCase().includes(q)
    );
  });

  const subTabs: { key: SubSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "channels", label: "Majburiy kanallar", icon: Radio },
    { key: "broadcast", label: "Ommaviy xabar (Rassilka)", icon: Megaphone },
    { key: "settings", label: "Matnlar va Bildirishnomalar", icon: Settings2 },
    { key: "users", label: "Bot a’zolari va Adminlar", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Ogohlantirishlar (agar Token yoki 0009 migratsiya hali yoqilmagan bo'lsa) */}
      {(!data.botConfigured || !data.migrationReady) && (
        <div className="rounded-2xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Faollashtirish talab etiladi</span>
          </div>
          {!data.botConfigured && (
            <p className="text-xs">
              • <code>TELEGRAM_BOT_TOKEN</code> hali Vercel Environment Variables ga kiritilmagan.
            </p>
          )}
          {!data.migrationReady && (
            <p className="text-xs">
              • <code>0009_telegram_bot_admin.sql</code> migratsiyasi hali Supabase SQL Editor’da
              ishga tushirilmagan.
            </p>
          )}
        </div>
      )}

      {/* Bot holati va 4 ta KPI */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0088CC] to-[#2563EB] text-white shadow-md shadow-[#0088CC]/25">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-extrabold text-[#172033] dark:text-white">
                  Telegram Bot Boshqaruv Markazi
                </h2>
                {data.botConfigured && data.webhookUrl ? (
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Wifi className="h-3 w-3" />
                    Faol • {data.botUsername ? `@${data.botUsername}` : "Ulangan"}
                  </Badge>
                ) : (
                  <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    <WifiOff className="h-3 w-3" />
                    Webhook ulanmagan
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {data.webhookUrl
                  ? `Webhook: ${data.webhookUrl}`
                  : "Bot tokenini kiritgach, 1 klik bilan webhook’ni ulang."}
                {data.webhookLastError ? ` • Oxirgi xato: ${data.webhookLastError}` : ""}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || !data.botConfigured}
            onClick={() => runAction(() => adminSyncTelegramWebhookAction())}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Webhook’ni ulash / tekshirish
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Users className="h-3.5 w-3.5 text-[#2563EB]" />
              Bot foydalanuvchilari
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#172033] dark:text-white">
              {data.stats.totalBotUsers}
            </div>
          </div>
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Link2 className="h-3.5 w-3.5 text-[#10B981]" />
              Saytga bog‘langan
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#172033] dark:text-white">
              {data.stats.linkedUsers}
            </div>
          </div>
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Radio className="h-3.5 w-3.5 text-[#0EA5E9]" />
              Faol majburiy kanallar
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#172033] dark:text-white">
              {data.stats.activeChannels}
            </div>
          </div>
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <KeyRound className="h-3.5 w-3.5 text-amber-500" />
              Bugungi 6 xonali kodlar
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-[#172033] dark:text-white">
              {data.stats.todayOtps}
            </div>
          </div>
        </div>
      </Card>

      {/* Ichki bo'lim tugmalari */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((item) => {
          const Icon = item.icon;
          const active = sub === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSub(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border ${
                active
                  ? "bg-[#0088CC] text-white border-[#0088CC] shadow-sm shadow-[#0088CC]/25"
                  : "bg-white dark:bg-[#111C35] text-[#64748B] dark:text-slate-300 border-[#DCE5F5] dark:border-[#22345A] hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          1. MAJBURIY KANALLAR BO'LIMI
          =================================================================== */}
      {sub === "channels" && (
        <div className="space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold">Yangi majburiy kanal qo‘shish</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Avval botingizni o‘sha kanalga <strong>Administrator</strong> qilib qo‘shing —
                  tizim qo‘shish paytida adminlikni avtomatik tekshiradi.
                </p>
              </div>
              <Badge
                className={
                  data.settings.require_subscription
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }
              >
                Majburiy obuna: {data.settings.require_subscription ? "YOQIQ" : "O‘CHIQ"}
              </Badge>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                runAction(() => adminAddRequiredChannelAction(fd), () => form.reset());
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <Label htmlFor="ch_title">Kanal nomi (tugmada ko‘rinadi) *</Label>
                <Input
                  id="ch_title"
                  name="title"
                  required
                  placeholder="Masalan: Baliqchi Kengashi"
                />
              </div>
              <div>
                <Label htmlFor="ch_chat_id">@username yoki Yopiq ID (-100...) *</Label>
                <Input
                  id="ch_chat_id"
                  name="chat_id"
                  required
                  placeholder="@baliqchi_kengash yoki -100123456"
                />
              </div>
              <div>
                <Label htmlFor="ch_invite">Taklif havolasi (ixtiyoriy ochiq kanal uchun)</Label>
                <Input
                  id="ch_invite"
                  name="invite_link"
                  placeholder="https://t.me/baliqchi_kengash"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Kanal qo‘shish
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-display text-base font-bold">
              Majburiy kanallar ro‘yxati ({data.channels.length})
            </h3>

            {data.channels.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4">
                Hozircha majburiy kanallar qo‘shilmagan. Kanal qo‘shsangiz, botga kirgan har bir
                o‘quvchi 6 xonali kod olishdan oldin ularga a’zo bo‘lishi shart bo‘ladi.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF]/60 dark:bg-[#0B1224]/50 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#172033] dark:text-white">
                          {ch.title}
                        </span>
                        <Badge
                          className={
                            ch.is_active
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }
                        >
                          {ch.is_active ? "Faol" : "O‘chiq"}
                        </Badge>
                        <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[11px]">
                          {ch.chat_id}
                        </code>
                      </div>
                      <a
                        href={ch.invite_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-[#2563EB] dark:text-[#38BDF8] hover:underline"
                      >
                        {ch.invite_link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => runAction(() => adminVerifyRequiredChannelAction(ch.chat_id))}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                        Adminlikni tekshirish
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={ch.is_active ? "outline" : "primary"}
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => adminToggleRequiredChannelAction(ch.id, !ch.is_active))
                        }
                      >
                        {ch.is_active ? "O‘chirib qo‘yish" : "Faollashtirish"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={isPending}
                        onClick={() => runAction(() => adminDeleteRequiredChannelAction(ch.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================
          2. OMMAVIY XABAR YUBORISH (RASSILKA — BATCH PROGRESS BAR)
          =================================================================== */}
      {sub === "broadcast" && (
        <div className="space-y-5">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold">
                Telegram Bot orqali ommaviy xabar yuborish (Rassilka)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Xabarlar 20 tadan bo‘lib-bo‘lib (batch) yuboriladi — minglab o‘quvchilarga ham
                Vercel timeout bermasdan xavfsiz yetib boradi. HTML teglari (
                <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>) qo‘llab-quvvatlanadi.
              </p>
            </div>

            <form onSubmit={handleStartBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bc_audience">Auditoriya *</Label>
                  <Select
                    id="bc_audience"
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as "all" | "registered" | "unregistered" | "school")
                    }
                    disabled={broadcasting}
                  >
                    <option value="all">Barcha bot foydalanuvchilari ({data.stats.totalBotUsers})</option>
                    <option value="registered">
                      Faqat saytda ro‘yxatdan o‘tganlar ({data.stats.linkedUsers})
                    </option>
                    <option value="unregistered">
                      Faqat hali ro‘yxatdan o‘tmaganlar (
                      {Math.max(0, data.stats.totalBotUsers - data.stats.linkedUsers)})
                    </option>
                    <option value="school">Tanlangan maktab (1–61) o‘quvchilari</option>
                  </Select>
                </div>

                {audience === "school" && (
                  <div>
                    <Label htmlFor="bc_school">Maktabni tanlang *</Label>
                    <Select
                      id="bc_school"
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      required
                      disabled={broadcasting}
                    >
                      <option value="">Maktabni tanlang...</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_number}-maktab — {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="bc_text">Xabar matni (HTML ruxsat etilgan) *</Label>
                <Textarea
                  id="bc_text"
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={broadcasting}
                  placeholder="Masalan: 🗳 <b>Haftalik ovoz berish boshlandi!</b>&#10;O‘z maktabingiz loyihasini qo‘llab-quvvatlang..."
                  className="min-h-[110px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="bc_photo">Rasm URL (ixtiyoriy)</Label>
                  <Input
                    id="bc_photo"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    disabled={broadcasting}
                    placeholder="https://.../poster.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="bc_btn_text">Inline tugma matni (ixtiyoriy)</Label>
                  <Input
                    id="bc_btn_text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    disabled={broadcasting}
                    placeholder="🗳 Ovoz berishga o‘tish"
                  />
                </div>
                <div>
                  <Label htmlFor="bc_btn_url">Inline tugma havolasi (ixtiyoriy)</Label>
                  <Input
                    id="bc_btn_url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    disabled={broadcasting}
                    placeholder="https://baliqchi-kengash.vercel.app/ovoz-berish"
                  />
                </div>
              </div>

              {broadcastProgress && (
                <div className="rounded-2xl border border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[#0B1224] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>
                      {broadcastProgress.done ? "✅ Yuborish yakunlandi" : "📤 Yuborilmoqda..."}
                    </span>
                    <span>
                      {broadcastProgress.sent + broadcastProgress.failed} / {broadcastProgress.total}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#10B981] transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((broadcastProgress.sent + broadcastProgress.failed) /
                              Math.max(1, broadcastProgress.total)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-[11px] text-[#64748B]">
                    <span className="text-[#10B981] font-semibold">
                      Yetkazildi: {broadcastProgress.sent}
                    </span>
                    <span className="text-rose-500 font-semibold">
                      Bloklagan / xato: {broadcastProgress.failed}
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={broadcasting || !data.botConfigured}
              >
                {broadcasting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {broadcasting ? "Yuborilmoqda (sahifani yopmang)..." : "Xabarni yuborishni boshlash"}
              </Button>
            </form>
          </Card>

          {/* Yuborilgan rassilkalar tarixi */}
          <Card className="p-6 space-y-3">
            <h3 className="font-display text-base font-bold">
              Oxirgi yuborilgan xabarlar ({data.broadcasts.length})
            </h3>
            {data.broadcasts.length === 0 ? (
              <p className="text-sm text-[#64748B]">Hali ommaviy xabar yuborilmagan.</p>
            ) : (
              <div className="space-y-2.5">
                {data.broadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            bc.status === "completed"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          }
                        >
                          {bc.status === "completed" ? "Yakunlangan" : bc.status}
                        </Badge>
                        <Badge className="border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {bc.audience}
                        </Badge>
                        <span className="font-semibold text-[#10B981]">
                          ✅ {bc.sent_count} / {bc.total_targets}
                        </span>
                        {bc.failed_count > 0 && (
                          <span className="text-rose-500">❌ {bc.failed_count}</span>
                        )}
                      </div>
                      <span className="text-[#64748B]">{formatUzDate(bc.created_at)}</span>
                    </div>
                    <p className="text-[#172033] dark:text-slate-300 line-clamp-2 whitespace-pre-wrap">
                      {bc.message_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================
          3. MATNLAR, MAJBURIY OBUNA VA AVTOMATIK BILDIRISHNOMALAR
          =================================================================== */}
      {sub === "settings" && (
        <Card className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("require_subscription", String(requireSub));
              fd.set("notify_role_updates", String(notifyRoles));
              fd.set("notify_project_updates", String(notifyProjects));
              fd.set("notify_voting_weeks", String(notifyVoting));
              fd.set("maintenance_mode", String(maintenanceMode));
              runAction(() => adminUpdateTelegramSettingsAction(fd));
            }}
            className="space-y-5"
          >
            <div>
              <h3 className="font-display text-base font-bold">
                Bot rejimlari va avtomatik Telegram bildirishnomalari
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Barcha o‘zgarishlar darhol botda kuchga kiradi — kodga tegish shart emas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Majburiy kanallarga obuna",
                  desc: "Kod olishdan oldin kanallarga a’zolikni tekshiradi",
                  checked: requireSub,
                  onChange: setRequireSub,
                },
                {
                  label: "Lavozim / Rol bildirishnomasi",
                  desc: "Ariza tasdiqlanganda yoki lavozim berilganda Telegramga yozadi",
                  checked: notifyRoles,
                  onChange: setNotifyRoles,
                },
                {
                  label: "Loyiha holati bildirishnomasi",
                  desc: "Loyiha moderatsiyadan o‘tganda muallifga Telegramga yozadi",
                  checked: notifyProjects,
                  onChange: setNotifyProjects,
                },
                {
                  label: "Yangi ovoz berish haftasi",
                  desc: "Hafta faollashganda bog‘langan o‘quvchilarga xabar yuboradi",
                  checked: notifyVoting,
                  onChange: setNotifyVoting,
                },
                {
                  label: "Texnik ishlar rejimi",
                  desc: "Yoqilsa, oddiy foydalanuvchilarga vaqtincha tanaffus xabari chiqadi",
                  checked: maintenanceMode,
                  onChange: setMaintenanceMode,
                },
              ].map((toggle) => (
                <label
                  key={toggle.label}
                  className="flex items-start gap-3 rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF]/60 dark:bg-[#0B1224]/60 p-3.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={toggle.checked}
                    onChange={(e) => toggle.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded accent-[#2563EB]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#172033] dark:text-white flex items-center gap-1.5">
                      <BellRing className="h-3.5 w-3.5 text-[#2563EB]" />
                      {toggle.label}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{toggle.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="st_welcome">/start Xush kelibsiz matni (HTML)</Label>
                <Textarea
                  id="st_welcome"
                  name="welcome_message"
                  defaultValue={data.settings.welcome_message}
                  className="min-h-[90px]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="st_subscribe">Majburiy obuna talabi matni (HTML)</Label>
                <Textarea
                  id="st_subscribe"
                  name="subscribe_message"
                  defaultValue={data.settings.subscribe_message}
                  className="min-h-[90px]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="st_otp_footer">6 xonali kod pastidagi izoh (HTML)</Label>
                <Textarea
                  id="st_otp_footer"
                  name="otp_footer_message"
                  defaultValue={data.settings.otp_footer_message}
                  className="min-h-[70px]"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Sozlamalarni saqlash
            </Button>
          </form>
        </Card>
      )}

      {/* ===================================================================
          4. BOT FOYDALANUVCHILARI VA BOT ICHIDAGI /admin ADMINLARI
          =================================================================== */}
      {sub === "users" && (
        <div className="space-y-5">
          {/* Bot ichidagi /admin ruxsati */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
                Bot ichidagi <code>/admin</code> menyusi adminlari ({data.botAdmins.length})
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Bu yerga Telegram ID kiritilgan mas’ullar (hamda saytdagi Super Admin hisobiga
                bog‘langan Telegram akkaunt) botga <code>/admin</code> yozib tezkor menyuni ocha
                oladi.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                runAction(() => adminAddTelegramBotAdminAction(fd), () => form.reset());
              }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div>
                <Label htmlFor="adm_tg_id">Telegram User ID (raqam) *</Label>
                <Input
                  id="adm_tg_id"
                  name="telegram_user_id"
                  type="number"
                  required
                  placeholder="Masalan: 123456789"
                />
              </div>
              <div>
                <Label htmlFor="adm_label">Ismi / Izoh *</Label>
                <Input
                  id="adm_label"
                  name="label"
                  required
                  placeholder="Masalan: Islombek (Super Admin)"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
                  <Plus className="h-4 w-4" />
                  Bot admin qo‘shish
                </Button>
              </div>
            </form>

            {data.botAdmins.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {data.botAdmins.map((a) => (
                  <div
                    key={a.telegram_user_id}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224] px-3 py-2 text-xs"
                  >
                    <span className="font-bold">{a.label}</span>
                    <code className="text-[11px] text-[#64748B]">{a.telegram_user_id}</code>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => adminRemoveTelegramBotAdminAction(a.telegram_user_id))
                      }
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Olib tashlash"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Bot foydalanuvchilari jadvali + Ban */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-bold">
                Bot foydalanuvchilari ({filteredBotUsers.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ID, @username yoki ism..."
                  className="pl-9"
                />
              </div>
            </div>

            {filteredBotUsers.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4">Foydalanuvchilar topilmadi.</p>
            ) : (
              <div className="space-y-2">
                {filteredBotUsers.map((u) => (
                  <div
                    key={u.telegram_user_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] p-3.5 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#172033] dark:text-white">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Telegram foydalanuvchi"}
                        </span>
                        {u.username && (
                          <span className="text-[#2563EB] dark:text-[#38BDF8]">@{u.username}</span>
                        )}
                        <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[11px]">
                          ID: {u.telegram_user_id}
                        </code>
                        {u.linked_user ? (
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Sayt: {u.linked_user.first_name} {u.linked_user.last_name}
                          </Badge>
                        ) : (
                          <Badge className="border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Ro‘yxatdan o‘tmagan
                          </Badge>
                        )}
                        {u.is_blocked_by_user && (
                          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            Botni bloklagan
                          </Badge>
                        )}
                        {u.is_banned && (
                          <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                            Qora ro‘yxatda
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Oxirgi faollik: {formatUzDate(u.last_seen_at)}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={u.is_banned ? "outline" : "danger"}
                      disabled={isPending}
                      onClick={() =>
                        runAction(() =>
                          adminToggleTelegramUserBanAction(u.telegram_user_id, !u.is_banned)
                        )
                      }
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {u.is_banned ? "Blokdan chiqarish" : "Bloklash"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
