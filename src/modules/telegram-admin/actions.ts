"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserContext } from "@/core/db/queries";
import { createSupabaseAdminClient } from "@/core/db/admin";
import { getAdminPanelPath } from "@/core/config/admin-path";
import {
  getSiteBaseUrl,
  getTelegramBotToken,
  setTelegramWebhook,
  verifyBotChannelAdmin,
} from "@/core/telegram/bot";
import type { ActionResult } from "@/modules/accounts/actions";

async function requireSuperAdmin() {
  const ctx = await getCurrentUserContext();
  if (!ctx || !ctx.isSuperAdmin) return null;
  return ctx;
}

async function auditTelegramAction(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  newData: Record<string, unknown>
) {
  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return;
  await adminClient.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: newData,
  });
}

// 1. BOT GLOBAL SOZLAMALARI VA MATNLARINI YANGILASH
export async function adminUpdateTelegramSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const payload = {
    id: 1,
    require_subscription: formData.get("require_subscription") === "true",
    notify_role_updates: formData.get("notify_role_updates") === "true",
    notify_project_updates: formData.get("notify_project_updates") === "true",
    notify_voting_weeks: formData.get("notify_voting_weeks") === "true",
    maintenance_mode: formData.get("maintenance_mode") === "true",
    welcome_message: String(formData.get("welcome_message") || "").trim(),
    subscribe_message: String(formData.get("subscribe_message") || "").trim(),
    otp_footer_message: String(formData.get("otp_footer_message") || "").trim(),
    updated_at: new Date().toISOString(),
  };

  if (payload.welcome_message.length < 10 || payload.subscribe_message.length < 10) {
    return { ok: false, message: "Bot xabar matnlari kamida 10 belgidan iborat bo‘lsin." };
  }

  const { error } = await adminClient
    .from("telegram_bot_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) return { ok: false, message: "Sozlamalarni saqlashda xatolik: " + error.message };

  await auditTelegramAction(admin.user.id, "telegram_settings_updated", "telegram_bot_settings", "1", {
    require_subscription: payload.require_subscription,
    notify_role_updates: payload.notify_role_updates,
    notify_project_updates: payload.notify_project_updates,
    notify_voting_weeks: payload.notify_voting_weeks,
    maintenance_mode: payload.maintenance_mode,
  });

  revalidatePath(getAdminPanelPath());
  return { ok: true, message: "Telegram bot sozlamalari va matnlari saqlandi!" };
}

// 2. MAJBURIY KANAL QO'SHISH (Bot kanalda Admin ekanini avtomatik tekshiradi!)
export async function adminAddRequiredChannelAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  let title = String(formData.get("title") || "").trim();
  let chatId = String(formData.get("chat_id") || "").trim();
  let inviteLink = String(formData.get("invite_link") || "").trim();
  const sortOrder = Number(formData.get("sort_order") || 10);
  const skipCheck = formData.get("skip_check") === "true";

  // @username formatini tozalash
  if (chatId.startsWith("https://t.me/") || chatId.startsWith("t.me/")) {
    const slug = chatId.replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "").split("/")[0];
    if (slug && !slug.startsWith("+")) {
      chatId = `@${slug}`;
    }
  } else if (chatId && !chatId.startsWith("@") && !chatId.startsWith("-100")) {
    chatId = `@${chatId}`;
  }

  if (!chatId) {
    return {
      ok: false,
      message: "Kanal @username yoki yopiq kanal ID (-100...) ni kiriting.",
    };
  }

  // Ochiq kanal bo'lsa va invite link berilmagan bo'lsa, avtomatik yasaymiz
  if (!inviteLink && chatId.startsWith("@")) {
    inviteLink = `https://t.me/${chatId.slice(1)}`;
  }

  if (!inviteLink || !/^https:\/\/t\.me\//i.test(inviteLink)) {
    return {
      ok: false,
      message: "Yopiq kanal (-100...) uchun https://t.me/+... taklif havolasini kiriting.",
    };
  }

  // Bot tokeni mavjud bo'lsa — jonli tekshiramiz: bot ushbu kanalda Adminmi?
  if (getTelegramBotToken() && !skipCheck) {
    const check = await verifyBotChannelAdmin(chatId);
    if (!check.ok || !check.isAdmin) {
      return {
        ok: false,
        message:
          check.error ||
          "Bot ushbu kanalda Administrator emas. Avval botni kanalga admin qiling, so‘ngra qayta urining.",
      };
    }
    if (!title && check.chatTitle) {
      title = check.chatTitle;
    }
  }

  if (!title) {
    title = chatId.startsWith("@") ? chatId : "Rasmiy Telegram kanal";
  }

  const { data, error } = await adminClient
    .from("telegram_required_channels")
    .insert({
      title,
      chat_id: chatId,
      invite_link: inviteLink,
      is_active: true,
      sort_order: Number.isNaN(sortOrder) ? 10 : sortOrder,
      created_by: admin.user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ushbu kanal allaqachon majburiy ro‘yxatda mavjud." };
    }
    return { ok: false, message: "Kanal qo‘shishda xatolik: " + error.message };
  }

  await auditTelegramAction(admin.user.id, "telegram_channel_added", "telegram_required_channels", data.id, {
    title,
    chat_id: chatId,
    invite_link: inviteLink,
  });

  revalidatePath(getAdminPanelPath());
  return {
    ok: true,
    message: `«${title}» majburiy kanallar ro‘yxatiga qo‘shildi va tasdiqlandi!`,
  };
}

// 3. MAJBURIY KANALNI YOQISH / O'CHIRISH
export async function adminToggleRequiredChannelAction(
  channelId: string,
  nextActive: boolean
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const { error } = await adminClient
    .from("telegram_required_channels")
    .update({ is_active: nextActive })
    .eq("id", channelId);

  if (error) return { ok: false, message: error.message };

  await auditTelegramAction(
    admin.user.id,
    "telegram_channel_toggled",
    "telegram_required_channels",
    channelId,
    { is_active: nextActive }
  );

  revalidatePath(getAdminPanelPath());
  return {
    ok: true,
    message: nextActive ? "Kanal majburiy tekshiruvda faollashtirildi." : "Kanal vaqtincha o‘chirildi.",
  };
}

// 4. MAJBURIY KANALNI O'CHIRIB TASHLASH
export async function adminDeleteRequiredChannelAction(channelId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const { error } = await adminClient
    .from("telegram_required_channels")
    .delete()
    .eq("id", channelId);

  if (error) return { ok: false, message: error.message };

  await auditTelegramAction(
    admin.user.id,
    "telegram_channel_deleted",
    "telegram_required_channels",
    channelId,
    {}
  );

  revalidatePath(getAdminPanelPath());
  return { ok: true, message: "Kanal ro‘yxatdan o‘chirildi." };
}

// 5. KANALDA BOT ADMINLIGINI JONLI TEKSHIRISH
export async function adminVerifyRequiredChannelAction(chatId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  if (!getTelegramBotToken()) {
    return { ok: false, message: "TELEGRAM_BOT_TOKEN hali Vercel sozlamalariga kiritilmagan." };
  }

  const check = await verifyBotChannelAdmin(chatId);
  if (!check.ok || !check.isAdmin) {
    return { ok: false, message: check.error || "Bot kanalda admin emas." };
  }

  return {
    ok: true,
    message: `✅ Tasdiqlandi! Bot «${check.chatTitle || chatId}» kanalida Administrator sifatida ishlayapti.`,
  };
}

// 6. BOT FOYDALANUVCHISINI BLOKLASH / BLOKDAN CHIQARISH
export async function adminToggleTelegramUserBanAction(
  telegramUserId: number,
  nextBanned: boolean
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const { error } = await adminClient
    .from("telegram_bot_users")
    .update({ is_banned: nextBanned })
    .eq("telegram_user_id", telegramUserId);

  if (error) return { ok: false, message: error.message };

  await auditTelegramAction(
    admin.user.id,
    nextBanned ? "telegram_user_banned" : "telegram_user_unbanned",
    "telegram_bot_users",
    String(telegramUserId),
    { telegram_user_id: telegramUserId, is_banned: nextBanned }
  );

  revalidatePath(getAdminPanelPath());
  return {
    ok: true,
    message: nextBanned
      ? `Telegram ID ${telegramUserId} qora ro‘yxatga qo‘shildi.`
      : `Telegram ID ${telegramUserId} blokdan chiqarildi.`,
  };
}

// 7. BOT ICHIDAGI /admin MENYUSI UCHUN ADMIN QO'SHISH / O'CHIRISH
export async function adminAddTelegramBotAdminAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const tgIdRaw = String(formData.get("telegram_user_id") || "").trim();
  const label = String(formData.get("label") || "").trim() || "Super Admin";
  const tgId = Number(tgIdRaw);

  if (!tgIdRaw || !Number.isSafeInteger(tgId) || tgId <= 0) {
    return { ok: false, message: "To‘g‘ri Telegram User ID (raqam) kiriting." };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const { error } = await adminClient.from("telegram_bot_admins").upsert(
    {
      telegram_user_id: tgId,
      label,
      added_by: admin.user.id,
    },
    { onConflict: "telegram_user_id" }
  );

  if (error) return { ok: false, message: error.message };

  await auditTelegramAction(
    admin.user.id,
    "telegram_bot_admin_added",
    "telegram_bot_admins",
    String(tgId),
    { telegram_user_id: tgId, label }
  );

  revalidatePath(getAdminPanelPath());
  return {
    ok: true,
    message: `Telegram ID ${tgId} (${label}) ga bot ichidagi /admin menyusi ochildi!`,
  };
}

export async function adminRemoveTelegramBotAdminAction(
  telegramUserId: number
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return { ok: false, message: "Server bazasi ulanmagan." };

  const { error } = await adminClient
    .from("telegram_bot_admins")
    .delete()
    .eq("telegram_user_id", telegramUserId);

  if (error) return { ok: false, message: error.message };

  await auditTelegramAction(
    admin.user.id,
    "telegram_bot_admin_removed",
    "telegram_bot_admins",
    String(telegramUserId),
    { telegram_user_id: telegramUserId }
  );

  revalidatePath(getAdminPanelPath());
  return { ok: true, message: "Bot admin ruxsati olib tashlandi." };
}

// 8. WEBHOOK'NI ADMIN PANELDAN 1 KLIKDA ULASH / YANGILASH
export async function adminSyncTelegramWebhookAction(): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  if (!getTelegramBotToken()) {
    return {
      ok: false,
      message: "Avval Vercel Environment Variables ga TELEGRAM_BOT_TOKEN ni qo‘shing.",
    };
  }

  const webhookUrl = `${getSiteBaseUrl()}/api/telegram/webhook`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const res = await setTelegramWebhook(webhookUrl, secret);

  if (!res.ok) {
    return { ok: false, message: "Webhook ulashda xatolik: " + (res.description || "") };
  }

  await auditTelegramAction(admin.user.id, "telegram_webhook_synced", "telegram_bot", null, {
    webhookUrl,
  });

  revalidatePath(getAdminPanelPath());
  return {
    ok: true,
    message: `Webhook muvaffaqiyatli ulandi: ${webhookUrl}`,
  };
}
