import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/core/db/admin";
import { normalizeUzPhone } from "@/core/utils";
import { secureHash } from "@/core/security/rate-limit";
import { getAdminPanelPath } from "@/core/config/admin-path";
import {
  answerCallbackQuery,
  checkUserSubscriptions,
  editTelegramMessage,
  escapeHtml,
  getSiteBaseUrl,
  getTelegramBotSettings,
  getTelegramBotToken,
  isTelegramBotAdmin,
  sendTelegramMessage,
  type TelegramBotSettings,
  type TelegramRequiredChannel,
} from "@/core/telegram/bot";

interface TelegramFrom {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramUpdate {
  message?: {
    message_id: number;
    from?: TelegramFrom;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    contact?: {
      phone_number: string;
      first_name?: string;
      user_id?: number;
    };
  };
  callback_query?: {
    id: string;
    from: TelegramFrom;
    data?: string;
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
  };
}

const CONTACT_KEYBOARD = {
  keyboard: [[{ text: "📱 Telefon raqamimni tasdiqlash", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

function buildSubscriptionKeyboard(
  missingChannels: TelegramRequiredChannel[],
  mode: "verify" | "reset"
) {
  const rows: Array<Array<Record<string, string>>> = missingChannels.map((ch) => [
    { text: `📢 ${ch.title}`, url: ch.invite_link },
  ]);
  rows.push([
    {
      text: "✅ A’zo bo‘ldim — Tekshirish",
      callback_data: `check_sub:${mode}`,
    },
  ]);
  return { inline_keyboard: rows };
}

function buildAdminDashboardKeyboard(settings: TelegramBotSettings) {
  const webAdminUrl = `${getSiteBaseUrl()}${getAdminPanelPath()}`;
  return {
    inline_keyboard: [
      [
        { text: "📊 Statistika", callback_data: "adm:stats" },
        { text: "📢 Kanallar", callback_data: "adm:channels" },
      ],
      [
        {
          text: settings.require_subscription
            ? "🔒 Majburiy obuna: YOQIQ"
            : "🔓 Majburiy obuna: O‘CHIQ",
          callback_data: "adm:toggle_sub",
        },
      ],
      [
        {
          text: settings.maintenance_mode
            ? "🚧 Texnik rejim: YOQIQ"
            : "✅ Texnik rejim: O‘CHIQ",
          callback_data: "adm:toggle_maint",
        },
      ],
      [{ text: "🌐 To‘liq Web Admin Panelni ochish", url: webAdminUrl }],
    ],
  };
}

async function upsertBotUser(adminClient: SupabaseClient, from: TelegramFrom) {
  try {
    const { data: existingPriv } = await adminClient
      .from("user_private_details")
      .select("user_id")
      .eq("telegram_user_id", from.id)
      .maybeSingle();

    await adminClient.from("telegram_bot_users").upsert(
      {
        telegram_user_id: from.id,
        username: from.username || null,
        first_name: from.first_name || null,
        last_name: from.last_name || null,
        ...(existingPriv?.user_id ? { linked_user_id: existingPriv.user_id } : {}),
        is_blocked_by_user: false,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "telegram_user_id" }
    );
  } catch {
    // Migration 0009 hali ishga tushmagan bo'lsa ham bot to'xtab qolmaydi
  }
}

async function isUserBanned(adminClient: SupabaseClient, tgUserId: number): Promise<boolean> {
  try {
    const { data } = await adminClient
      .from("telegram_bot_users")
      .select("is_banned")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();
    return Boolean(data?.is_banned);
  } catch {
    return false;
  }
}

async function getActiveRequiredChannels(
  adminClient: SupabaseClient
): Promise<TelegramRequiredChannel[]> {
  try {
    const { data } = await adminClient
      .from("telegram_required_channels")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    return (data || []) as TelegramRequiredChannel[];
  } catch {
    return [];
  }
}

async function renderAdminStatsText(adminClient: SupabaseClient): Promise<string> {
  const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [usersRes, linkedRes, channelsRes, todayOtpRes, settings] = await Promise.all([
    adminClient.from("telegram_bot_users").select("telegram_user_id", { count: "exact", head: true }),
    adminClient
      .from("telegram_bot_users")
      .select("telegram_user_id", { count: "exact", head: true })
      .not("linked_user_id", "is", null),
    adminClient
      .from("telegram_required_channels")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    adminClient
      .from("telegram_verifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),
    getTelegramBotSettings(adminClient),
  ]);

  return [
    "🛡 <b>Telegram Bot — Tezkor Admin Paneli</b>",
    "",
    `👥 Jami bot foydalanuvchilari: <b>${usersRes.count ?? 0}</b>`,
    `🔗 Saytga bog‘langan o‘quvchilar: <b>${linkedRes.count ?? 0}</b>`,
    `📢 Faol majburiy kanallar: <b>${channelsRes.count ?? 0}</b>`,
    `🔑 Bugun berilgan 6 xonali kodlar: <b>${todayOtpRes.count ?? 0}</b>`,
    "",
    `🔒 Majburiy obuna: <b>${settings.require_subscription ? "YOQIQ" : "O‘CHIQ"}</b>`,
    `🔧 Texnik rejim: <b>${settings.maintenance_mode ? "YOQIQ" : "O‘CHIQ"}</b>`,
    "",
    "<i>Rassilka, kanal qo‘shish va matnlarni tahrirlash uchun pastdagi Web Admin Panel tugmasini bosing.</i>",
  ].join("\n");
}

async function sendContactPrompt(
  chatId: number,
  settings: TelegramBotSettings,
  isReset: boolean
) {
  const intro = isReset
    ? "🔐 <b>Parolni tiklash — Baliqchi tumani O‘quvchilar Kengashi</b>\n\nTasdiqlash kodini olish uchun pastdagi tugma orqali o‘zingizning telefon raqamingizni ulashing:"
    : settings.welcome_message;

  await sendTelegramMessage(chatId, intro, CONTACT_KEYBOARD);
}

export async function POST(request: Request) {
  const botToken = getTelegramBotToken();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!botToken) {
    return NextResponse.json({ ok: false, error: "Bot token not configured" }, { status: 503 });
  }

  // Telegram rasmiy webhook secret tekshiruvi
  if (webhookSecret) {
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ ok: true });
  }

  // =========================================================================
  // 1. INLINE TUGMALAR (CALLBACK QUERY) — OBUNA TEKSHIRISH + BOT ADMIN PANELI
  // =========================================================================
  if (update.callback_query) {
    const cq = update.callback_query;
    const tgUserId = cq.from.id;
    const chatId = cq.message?.chat.id;
    const messageId = cq.message?.message_id;
    const data = cq.data || "";

    await upsertBotUser(adminClient, cq.from);

    // 1A. Majburiy obunani qayta tekshirish
    if (data.startsWith("check_sub")) {
      const mode: "verify" | "reset" = data.endsWith(":reset") ? "reset" : "verify";
      const settings = await getTelegramBotSettings(adminClient);

      if (await isUserBanned(adminClient, tgUserId)) {
        await answerCallbackQuery(cq.id, "Sizning Telegram hisobingiz cheklangan.", true);
        return NextResponse.json({ ok: true });
      }

      if (!settings.require_subscription) {
        await answerCallbackQuery(cq.id, "✅ Obuna tekshiruvi tasdiqlandi!");
        if (chatId) await sendContactPrompt(chatId, settings, mode === "reset");
        return NextResponse.json({ ok: true });
      }

      const activeChannels = await getActiveRequiredChannels(adminClient);
      const { subscribedAll, missingChannels } = await checkUserSubscriptions(
        tgUserId,
        activeChannels
      );

      if (!subscribedAll) {
        const missingNames = missingChannels.map((c) => c.title).join(", ");
        await answerCallbackQuery(
          cq.id,
          `❌ Hali barcha kanallarga a’zo bo‘lmadingiz: ${missingNames}`,
          true
        );
        if (chatId && messageId) {
          await editTelegramMessage(
            chatId,
            messageId,
            `${settings.subscribe_message}\n\n⚠️ <i>Qolgan kanallar: ${missingChannels.length} ta</i>`,
            buildSubscriptionKeyboard(missingChannels, mode)
          );
        }
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(cq.id, "✅ Ajoyib! Barcha kanallarga a’zo bo‘ldingiz.");
      if (chatId && messageId) {
        await editTelegramMessage(
          chatId,
          messageId,
          "✅ <b>Barcha rasmiy kanallarga a’zolik tasdiqlandi!</b>\nEndi pastdagi tugma orqali telefon raqamingizni ulashing."
        );
      }
      if (chatId) {
        await sendContactPrompt(chatId, settings, mode === "reset");
      }
      return NextResponse.json({ ok: true });
    }

    // 1B. Bot ichidagi /admin tugmalari (faqat Telegram Bot Adminlari uchun!)
    if (data.startsWith("adm:")) {
      const isAdmin = await isTelegramBotAdmin(adminClient, tgUserId);
      if (!isAdmin) {
        await answerCallbackQuery(cq.id, "⛔ Sizda admin ruxsati yo‘q.", true);
        return NextResponse.json({ ok: true });
      }

      if (data === "adm:stats" || data === "adm:home") {
        const settings = await getTelegramBotSettings(adminClient);
        const text = await renderAdminStatsText(adminClient);
        await answerCallbackQuery(cq.id, "Statistika yangilandi");
        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, text, buildAdminDashboardKeyboard(settings));
        }
        return NextResponse.json({ ok: true });
      }

      if (data === "adm:toggle_sub") {
        const current = await getTelegramBotSettings(adminClient);
        const nextVal = !current.require_subscription;
        await adminClient
          .from("telegram_bot_settings")
          .update({ require_subscription: nextVal, updated_at: new Date().toISOString() })
          .eq("id", 1);
        const updated = { ...current, require_subscription: nextVal };
        const text = await renderAdminStatsText(adminClient);
        await answerCallbackQuery(
          cq.id,
          nextVal ? "🔒 Majburiy obuna YOQILDI" : "🔓 Majburiy obuna O‘CHIRILDI"
        );
        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, text, buildAdminDashboardKeyboard(updated));
        }
        return NextResponse.json({ ok: true });
      }

      if (data === "adm:toggle_maint") {
        const current = await getTelegramBotSettings(adminClient);
        const nextVal = !current.maintenance_mode;
        await adminClient
          .from("telegram_bot_settings")
          .update({ maintenance_mode: nextVal, updated_at: new Date().toISOString() })
          .eq("id", 1);
        const updated = { ...current, maintenance_mode: nextVal };
        const text = await renderAdminStatsText(adminClient);
        await answerCallbackQuery(
          cq.id,
          nextVal ? "🚧 Texnik rejim YOQILDI" : "✅ Texnik rejim O‘CHIRILDI"
        );
        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, text, buildAdminDashboardKeyboard(updated));
        }
        return NextResponse.json({ ok: true });
      }

      if (data === "adm:channels" || data.startsWith("adm:toggle_ch:")) {
        if (data.startsWith("adm:toggle_ch:")) {
          const chId = data.replace("adm:toggle_ch:", "");
          const { data: chRow } = await adminClient
            .from("telegram_required_channels")
            .select("id, is_active, title")
            .eq("id", chId)
            .maybeSingle();
          if (chRow) {
            await adminClient
              .from("telegram_required_channels")
              .update({ is_active: !chRow.is_active })
              .eq("id", chId);
            await answerCallbackQuery(
              cq.id,
              `${chRow.title}: ${!chRow.is_active ? "Faollashtirildi" : "O‘chirildi"}`
            );
          } else {
            await answerCallbackQuery(cq.id, "Kanal topilmadi");
          }
        } else {
          await answerCallbackQuery(cq.id);
        }

        const { data: allChannels } = await adminClient
          .from("telegram_required_channels")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        const list = (allChannels || []) as TelegramRequiredChannel[];
        const rows: Array<Array<Record<string, string>>> = list.map((ch) => [
          {
            text: `${ch.is_active ? "🟢" : "🔴"} ${ch.title} (${ch.chat_id})`,
            callback_data: `adm:toggle_ch:${ch.id}`,
          },
        ]);
        rows.push([{ text: "⬅️ Orqaga", callback_data: "adm:home" }]);

        const msgText =
          list.length > 0
            ? "📢 <b>Majburiy kanallar ro‘yxati</b>\n\nKanalni yoqish yoki o‘chirish uchun ustiga bosing (yangi kanal qo‘shish — Web Admin Panelda):"
            : "📢 Hozircha majburiy kanallar qo‘shilmagan. Web Admin Panel orqali qo‘shishingiz mumkin.";

        if (chatId && messageId) {
          await editTelegramMessage(chatId, messageId, msgText, { inline_keyboard: rows });
        }
        return NextResponse.json({ ok: true });
      }
    }

    await answerCallbackQuery(cq.id);
    return NextResponse.json({ ok: true });
  }

  // =========================================================================
  // 2. ODDIY XABARLAR (MESSAGE)
  // =========================================================================
  const msg = update.message;
  if (!msg || !msg.from || msg.chat.type !== "private") {
    return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;
  const tgUserId = msg.from.id;
  const text = (msg.text || "").trim();

  await upsertBotUser(adminClient, msg.from);

  // Bot ichidagi /admin buyrug'i (faqat ruxsat berilgan bot adminlariga!)
  if (text === "/admin") {
    const isAdmin = await isTelegramBotAdmin(adminClient, tgUserId);
    if (!isAdmin) {
      // Begonalar /admin borligini sezmasligi uchun oddiy xabar qaytaramiz
      await sendTelegramMessage(
        chatId,
        "6 xonali tasdiqlash kodini olish uchun /start buyrug‘ini bosing."
      );
      return NextResponse.json({ ok: true });
    }
    const settings = await getTelegramBotSettings(adminClient);
    const statsText = await renderAdminStatsText(adminClient);
    await sendTelegramMessage(chatId, statsText, buildAdminDashboardKeyboard(settings));
    return NextResponse.json({ ok: true });
  }

  // Qora ro'yxat (Ban) tekshiruvi
  if (await isUserBanned(adminClient, tgUserId)) {
    await sendTelegramMessage(
      chatId,
      "⛔ Sizning Telegram hisobingiz administrator tomonidan cheklangan. Murojaat uchun tuman Kengashi mas’uliga bog‘laning."
    );
    return NextResponse.json({ ok: true });
  }

  const settings = await getTelegramBotSettings(adminClient);

  // Texnik xizmat rejimi tekshiruvi (bot adminlariga ta'sir qilmaydi)
  if (settings.maintenance_mode) {
    const isAdmin = await isTelegramBotAdmin(adminClient, tgUserId);
    if (!isAdmin) {
      await sendTelegramMessage(
        chatId,
        "🚧 <b>Texnik ishlar olib borilmoqda.</b>\n\nBot qisqa tanaffusdan so‘ng qayta ishga tushadi. Birozdan so‘ng /start bosing."
      );
      return NextResponse.json({ ok: true });
    }
  }

  // Majburiy obunani tekshirish yordamchi funksiyasi
  async function ensureSubscribed(mode: "verify" | "reset"): Promise<boolean> {
    if (!settings.require_subscription) return true;
    const activeChannels = await getActiveRequiredChannels(adminClient!);
    if (activeChannels.length === 0) return true;

    const { subscribedAll, missingChannels } = await checkUserSubscriptions(
      tgUserId,
      activeChannels
    );
    if (subscribedAll) return true;

    await sendTelegramMessage(
      chatId,
      settings.subscribe_message,
      buildSubscriptionKeyboard(missingChannels, mode)
    );
    return false;
  }

  // 2A. /start buyrug'i
  if (text.startsWith("/start")) {
    const isReset = text.includes("reset");
    const okSub = await ensureSubscribed(isReset ? "reset" : "verify");
    if (!okSub) return NextResponse.json({ ok: true });

    await sendContactPrompt(chatId, settings, isReset);
    return NextResponse.json({ ok: true });
  }

  // 2B. Kontakt yuborilganda — avval majburiy obuna, so'ngra haqiqiy raqam va 6 xonali kod
  if (msg.contact) {
    const okSub = await ensureSubscribed("verify");
    if (!okSub) return NextResponse.json({ ok: true });

    // Muhim xavfsizlik: begona odamning kontaktini forward qilishni bloklash!
    if (msg.contact.user_id !== tgUserId) {
      await sendTelegramMessage(
        chatId,
        "❌ Iltimos, boshqa odamning kontaktini emas, pastdagi tugma orqali <b>o‘zingizning</b> telefon raqamingizni yuboring.",
        CONTACT_KEYBOARD
      );
      return NextResponse.json({ ok: true });
    }

    const phoneE164 = normalizeUzPhone(msg.contact.phone_number);
    if (!phoneE164) {
      await sendTelegramMessage(
        chatId,
        "❌ Faqat O‘zbekiston (+998) telefon raqamlari qabul qilinadi."
      );
      return NextResponse.json({ ok: true });
    }

    // Spam himoyasi: 30 soniya ichida qayta kod olishni cheklash
    const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString();
    const { data: recentCode } = await adminClient
      .from("telegram_verifications")
      .select("id")
      .eq("telegram_user_id", tgUserId)
      .gte("created_at", thirtySecsAgo)
      .limit(1)
      .maybeSingle();

    if (recentCode) {
      await sendTelegramMessage(
        chatId,
        "⏳ Iltimos, yangi kod olish uchun 30 soniya kuting va qayta urinib ko‘ring."
      );
      return NextResponse.json({ ok: true });
    }

    const phoneHash = secureHash(phoneE164);

    // Bu telefon raqami allaqachon ro'yxatdan o'tganmi?
    const { data: existingUser } = await adminClient
      .from("user_private_details")
      .select("user_id")
      .eq("phone_hash", phoneHash)
      .maybeSingle();

    const purpose = existingUser ? "reset_password" : "register";

    // Agar allaqachon ro'yxatdan o'tgan foydalanuvchi bo'lsa — Telegram ID ni ham bog'lab qo'yamiz
    if (existingUser?.user_id) {
      await adminClient
        .from("user_private_details")
        .update({
          telegram_user_id: tgUserId,
          telegram_verified_at: new Date().toISOString(),
        })
        .eq("user_id", existingUser.user_id)
        .is("telegram_user_id", null);

      await adminClient
        .from("telegram_bot_users")
        .update({ linked_user_id: existingUser.user_id })
        .eq("telegram_user_id", tgUserId);
    }

    // Kriptografik xavfsiz 6 xonali kod yaratish
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const codeHash = secureHash(`${phoneHash}:${otpCode}`);
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

    // Oldingi ishlatilmagan kodlarni bekor qilish
    await adminClient
      .from("telegram_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("phone_hash", phoneHash)
      .is("used_at", null);

    const { error: insertErr } = await adminClient.from("telegram_verifications").insert({
      telegram_user_id: tgUserId,
      phone_e164: phoneE164,
      phone_hash: phoneHash,
      code_hash: codeHash,
      purpose,
      expires_at: expiresAt,
    });

    if (insertErr) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Kod yaratishda xatolik yuz berdi. Qayta urinib ko‘ring."
      );
      return NextResponse.json({ ok: true });
    }

    const label =
      purpose === "reset_password"
        ? "Parolni tiklash kodingiz"
        : "Ro‘yxatdan o‘tish kodingiz";
    const siteUrl = getSiteBaseUrl();
    const targetUrl = `${siteUrl}/${purpose === "reset_password" ? "kirish" : "royxatdan-otish"}`;

    await sendTelegramMessage(
      chatId,
      `✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n📱 Raqam: <code>${escapeHtml(phoneE164)}</code>\n🔑 ${label}: <b><code>${otpCode}</code></b>\n\n${settings.otp_footer_message}\n${targetUrl}`,
      { remove_keyboard: true }
    );

    return NextResponse.json({ ok: true });
  }

  // Boshqa matn yuborilsa
  const okSub = await ensureSubscribed("verify");
  if (!okSub) return NextResponse.json({ ok: true });

  await sendTelegramMessage(
    chatId,
    "6 xonali tasdiqlash kodini olish uchun /start buyrug‘ini bosing va telefon raqamingizni ulashing.",
    CONTACT_KEYBOARD
  );

  return NextResponse.json({ ok: true });
}
