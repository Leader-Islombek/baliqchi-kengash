import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/core/db/admin";

export interface TelegramBotSettings {
  id: number;
  require_subscription: boolean;
  notify_role_updates: boolean;
  notify_project_updates: boolean;
  notify_voting_weeks: boolean;
  maintenance_mode: boolean;
  welcome_message: string;
  subscribe_message: string;
  otp_footer_message: string;
  updated_at?: string;
}

export interface TelegramRequiredChannel {
  id: string;
  title: string;
  chat_id: string;
  invite_link: string;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface TelegramBotUser {
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  linked_user_id: string | null;
  is_banned: boolean;
  is_blocked_by_user: boolean;
  last_seen_at: string;
  created_at: string;
  linked_user?: {
    id: string;
    first_name: string;
    last_name: string;
    school_id: string | null;
    grade: number | null;
  } | null;
}

export interface TelegramBotAdminRecord {
  telegram_user_id: number;
  label: string;
  added_by: string | null;
  created_at: string;
}

export interface TelegramBroadcastRecord {
  id: string;
  audience: "all" | "registered" | "unregistered" | "school";
  school_id: string | null;
  message_text: string;
  photo_url: string | null;
  button_text: string | null;
  button_url: string | null;
  total_targets: number;
  sent_count: number;
  failed_count: number;
  status: "draft" | "sending" | "completed" | "failed";
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export const DEFAULT_TELEGRAM_SETTINGS: TelegramBotSettings = {
  id: 1,
  require_subscription: true,
  notify_role_updates: true,
  notify_project_updates: true,
  notify_voting_weeks: true,
  maintenance_mode: false,
  welcome_message:
    "👋 <b>Baliqchi tumani O‘quvchilar Kengashi</b> rasmiy tasdiqlash botiga xush kelibsiz!\n\nRo‘yxatdan o‘tish va adolatli ovoz berish uchun pastdagi <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasini bosing:",
  subscribe_message:
    "📢 <b>Botdan foydalanish va 6 xonali kod olish uchun</b> Baliqchi tumani O‘quvchilar Kengashining rasmiy kanallariga a’zo bo‘ling.\n\nBarcha kanallarga qo‘shilgach, pastdagi <b>«✅ A’zo bo‘ldim — Tekshirish»</b> tugmasini bosing:",
  otp_footer_message:
    "⏱ Kod <b>10 daqiqa</b> amal qiladi. Uni hech kimga bermang va saytga kiriting.",
};

export function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "https://baliqchi-kengash.vercel.app"
  );
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export async function telegramApiCall<T = unknown>(
  method: string,
  payload?: Record<string, unknown>,
  tokenOverride?: string
): Promise<TelegramApiResponse<T>> {
  const token = tokenOverride || getTelegramBotToken();
  if (!token) {
    return { ok: false, error_code: 503, description: "TELEGRAM_BOT_TOKEN sozlanmagan." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const json = (await res.json()) as TelegramApiResponse<T>;
    return json;
  } catch (err) {
    return {
      ok: false,
      error_code: 500,
      description: err instanceof Error ? err.message : "Telegram API ulanish xatosi",
    };
  }
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  return telegramApiCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function sendTelegramPhoto(
  chatId: number | string,
  photoUrl: string,
  caption: string,
  replyMarkup?: Record<string, unknown>
) {
  return telegramApiCall("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  return telegramApiCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
) {
  return telegramApiCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
    show_alert: showAlert,
  });
}

export async function getTelegramBotInfo() {
  return telegramApiCall<{ id: number; username?: string; first_name?: string }>("getMe");
}

export async function getTelegramWebhookInfo() {
  return telegramApiCall<{
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
  }>("getWebhookInfo");
}

export async function setTelegramWebhook(url: string, secretToken?: string) {
  return telegramApiCall<boolean>("setWebhook", {
    url,
    allowed_updates: ["message", "callback_query"],
    ...(secretToken ? { secret_token: secretToken } : {}),
  });
}

export async function verifyBotChannelAdmin(chatId: string): Promise<{
  ok: boolean;
  isAdmin: boolean;
  chatTitle?: string;
  chatUsername?: string;
  error?: string;
}> {
  const me = await getTelegramBotInfo();
  if (!me.ok || !me.result) {
    return { ok: false, isAdmin: false, error: me.description || "Bot tokeni ishlamayapti." };
  }

  const chatRes = await telegramApiCall<{
    id: number;
    title?: string;
    username?: string;
    type: string;
  }>("getChat", { chat_id: chatId });

  if (!chatRes.ok || !chatRes.result) {
    return {
      ok: false,
      isAdmin: false,
      error:
        "Kanal topilmadi yoki bot hali kanalga qo‘shilmagan. Avval botni kanalga Administrator qilib qo‘shing.",
    };
  }

  const memberRes = await telegramApiCall<{ status: string }>("getChatMember", {
    chat_id: chatId,
    user_id: me.result.id,
  });

  if (!memberRes.ok || !memberRes.result) {
    return {
      ok: false,
      isAdmin: false,
      chatTitle: chatRes.result.title,
      chatUsername: chatRes.result.username,
      error: "Bot ushbu kanalda a’zolarni tekshira olmadi. Botga Administrator huquqini bering.",
    };
  }

  const isAdmin = ["administrator", "creator"].includes(memberRes.result.status);
  return {
    ok: true,
    isAdmin,
    chatTitle: chatRes.result.title,
    chatUsername: chatRes.result.username,
    error: isAdmin
      ? undefined
      : "Bot kanalda oddiy a’zo sifatida turibdi — majburiy obunani tekshirish uchun uni Administrator qiling.",
  };
}

export async function checkUserSubscriptions(
  telegramUserId: number,
  channels: TelegramRequiredChannel[]
): Promise<{
  subscribedAll: boolean;
  missingChannels: TelegramRequiredChannel[];
}> {
  const activeChannels = channels.filter((c) => c.is_active);
  if (activeChannels.length === 0) {
    return { subscribedAll: true, missingChannels: [] };
  }

  const results = await Promise.all(
    activeChannels.map(async (channel) => {
      const res = await telegramApiCall<{ status: string; is_member?: boolean }>("getChatMember", {
        chat_id: channel.chat_id,
        user_id: telegramUserId,
      });

      // Agar bot kanaldan chiqarib yuborilgan bo'lsa — o'quvchilarni butunlay bloklab qo'ymaslik
      if (!res.ok || !res.result) {
        if (res.error_code === 400 || res.error_code === 403) {
          console.warn(
            `[Telegram SubCheck] Bot cannot inspect channel ${channel.chat_id}: ${res.description}`
          );
          return { channel, subscribed: true };
        }
        return { channel, subscribed: false };
      }

      const status = res.result.status;
      const subscribed =
        status === "member" ||
        status === "administrator" ||
        status === "creator" ||
        (status === "restricted" && res.result.is_member === true);

      return { channel, subscribed };
    })
  );

  const missingChannels = results.filter((r) => !r.subscribed).map((r) => r.channel);
  return {
    subscribedAll: missingChannels.length === 0,
    missingChannels,
  };
}

export async function getTelegramBotSettings(
  adminClient: SupabaseClient
): Promise<TelegramBotSettings> {
  const { data, error } = await adminClient
    .from("telegram_bot_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_TELEGRAM_SETTINGS;
  }

  return data as TelegramBotSettings;
}

export async function isTelegramBotAdmin(
  adminClient: SupabaseClient,
  telegramUserId: number
): Promise<boolean> {
  // 1) To'g'ridan-to'g'ri telegram_bot_admins jadvalida bormi?
  const { data: botAdmin } = await adminClient
    .from("telegram_bot_admins")
    .select("telegram_user_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (botAdmin) return true;

  // 2) Yoki saytdagi Super Admin akkauntiga bog'langanmi?
  const { data: priv } = await adminClient
    .from("user_private_details")
    .select("user_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (!priv?.user_id) return false;

  const { data: superRole } = await adminClient
    .from("user_roles")
    .select("id")
    .eq("user_id", priv.user_id)
    .eq("role", "super_admin")
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  return Boolean(superRole);
}

/**
 * Sayt foydalanuvchisiga uning bog'langan Telegram akkauntiga shaxsiy bildirishnoma yuborish.
 * Hech qachon asosiy amalni (Server Action) to'xtatib qo'ymaydi.
 */
export async function notifyUserViaTelegram(
  userId: string,
  messageHtml: string,
  button?: { text: string; url: string }
): Promise<boolean> {
  try {
    if (!getTelegramBotToken()) return false;
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return false;

    const { data: priv } = await adminClient
      .from("user_private_details")
      .select("telegram_user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!priv?.telegram_user_id) return false;

    const replyMarkup = button
      ? { inline_keyboard: [[{ text: button.text, url: button.url }]] }
      : undefined;

    const res = await sendTelegramMessage(priv.telegram_user_id, messageHtml, replyMarkup);

    if (!res.ok && res.error_code === 403) {
      await adminClient
        .from("telegram_bot_users")
        .update({ is_blocked_by_user: true })
        .eq("telegram_user_id", priv.telegram_user_id);
      return false;
    }

    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyRoleUpdateViaTelegram(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    if (!getTelegramBotToken()) return;
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return;
    const settings = await getTelegramBotSettings(adminClient);
    if (!settings.notify_role_updates) return;

    const siteUrl = getSiteBaseUrl();
    await notifyUserViaTelegram(
      userId,
      `🎖 <b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`,
      { text: "👤 Shaxsiy kabinetni ochish", url: `${siteUrl}/kabinet` }
    );
  } catch {
    // Silent fallback
  }
}

export async function notifyProjectUpdateViaTelegram(
  userId: string,
  projectTitle: string,
  statusLabel: string,
  projectSlug?: string | null,
  note?: string | null
): Promise<void> {
  try {
    if (!getTelegramBotToken()) return;
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return;
    const settings = await getTelegramBotSettings(adminClient);
    if (!settings.notify_project_updates) return;

    const siteUrl = getSiteBaseUrl();
    const noteLine = note ? `\n📝 <i>Izoh: ${escapeHtml(note)}</i>` : "";
    await notifyUserViaTelegram(
      userId,
      `🚀 <b>Loyihangiz holati yangilandi!</b>\n\n📌 <b>${escapeHtml(projectTitle)}</b>\n📊 Yangi holat: <b>${escapeHtml(statusLabel)}</b>${noteLine}`,
      {
        text: "🔎 Loyihani ko‘rish",
        url: projectSlug ? `${siteUrl}/loyihalar/${projectSlug}` : `${siteUrl}/loyihalar`,
      }
    );
  } catch {
    // Silent fallback
  }
}

export async function notifyActiveVotingWeekViaTelegram(weekTitle: string): Promise<void> {
  try {
    if (!getTelegramBotToken()) return;
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) return;
    const settings = await getTelegramBotSettings(adminClient);
    if (!settings.notify_voting_weeks) return;

    // Tezkor bildirishnoma (timeout bo'lmasligi uchun birinchi 40 ta bog'langan foydalanuvchiga darhol;
    // qolganlar uchun Super Admin Rassilka bo'limidan to'liq batch yuborishi mumkin)
    const { data: users } = await adminClient
      .from("telegram_bot_users")
      .select("telegram_user_id")
      .eq("is_banned", false)
      .eq("is_blocked_by_user", false)
      .not("linked_user_id", "is", null)
      .limit(40);

    if (!users || users.length === 0) return;

    const siteUrl = getSiteBaseUrl();
    const message = `🗳 <b>Yangi haftalik ovoz berish boshlandi!</b>\n\n📅 <b>${escapeHtml(weekTitle)}</b>\n\n61 ta maktab yoshlari loyihalaridan eng munosibiga 1 ta ovoz bering!`;
    const replyMarkup = {
      inline_keyboard: [[{ text: "🗳 Ovoz berishga o‘tish", url: `${siteUrl}/ovoz-berish` }]],
    };

    await Promise.allSettled(
      users.map(async (u) => {
        const res = await sendTelegramMessage(u.telegram_user_id, message, replyMarkup);
        if (!res.ok && res.error_code === 403) {
          await adminClient
            .from("telegram_bot_users")
            .update({ is_blocked_by_user: true })
            .eq("telegram_user_id", u.telegram_user_id);
        }
      })
    );
  } catch {
    // Silent fallback
  }
}
