import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/core/db/admin";
import { normalizeUzPhone } from "@/core/utils";
import { secureHash } from "@/core/security/rate-limit";

interface TelegramUpdate {
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
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
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
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

  const msg = update.message;
  if (!msg || !msg.from || msg.chat.type !== "private") {
    return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;
  const tgUserId = msg.from.id;
  const text = (msg.text || "").trim();

  // 1. /start komandasi — telefon raqamini ulashish tugmasini chiqarish
  if (text.startsWith("/start")) {
    const isReset = text.includes("reset");
    const intro = isReset
      ? "🔐 <b>Parolni tiklash — Baliqchi tumani O‘quvchilar Kengashi</b>\n\nTasdiqlash kodini olish uchun pastdagi tugma orqali o‘zingizning telefon raqamingizni ulashing:"
      : "👋 <b>Baliqchi tumani O‘quvchilar Kengashi</b> rasmiy tasdiqlash botiga xush kelibsiz!\n\nRo‘yxatdan o‘tish va adolatli ovoz berish uchun pastdagi <b>«📱 Telefon raqamimni tasdiqlash»</b> tugmasini bosing:";

    await sendTelegramMessage(botToken, chatId, intro, {
      keyboard: [[{ text: "📱 Telefon raqamimni tasdiqlash", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    });
    return NextResponse.json({ ok: true });
  }

  // 2. Kontakt yuborilganda — haqiqiy raqamni tekshirish va 6 xonali kod berish
  if (msg.contact) {
    // Muhim xavfsizlik: begona odamning kontaktini forward qilishni bloklash!
    if (msg.contact.user_id !== tgUserId) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "❌ Iltimos, boshqa odamning kontaktini emas, pastdagi tugma orqali <b>o‘zingizning</b> telefon raqamingizni yuboring.",
        {
          keyboard: [[{ text: "📱 Telefon raqamimni tasdiqlash", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      );
      return NextResponse.json({ ok: true });
    }

    const phoneE164 = normalizeUzPhone(msg.contact.phone_number);
    if (!phoneE164) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "❌ Faqat O‘zbekiston (+998) telefon raqamlari qabul qilinadi."
      );
      return NextResponse.json({ ok: true });
    }

    const adminClient = createSupabaseAdminClient();
    if (!adminClient) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "⚠️ Server sozlamalarida vaqtinchalik xatolik. Birozdan so‘ng qayta urinib ko‘ring."
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
        botToken,
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
        botToken,
        chatId,
        "⚠️ Kod yaratishda xatolik yuz berdi. Qayta urinib ko‘ring."
      );
      return NextResponse.json({ ok: true });
    }

    const label =
      purpose === "reset_password"
        ? "Parolni tiklash kodingiz"
        : "Ro‘yxatdan o‘tish kodingiz";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://baliqchi-kengash.vercel.app";

    await sendTelegramMessage(
      botToken,
      chatId,
      `✅ <b>Telefon raqamingiz tasdiqlandi!</b>\n\n📱 Raqam: <code>${phoneE164}</code>\n🔑 ${label}: <b><code>${otpCode}</code></b>\n\n⏱ Kod <b>10 daqiqa</b> amal qiladi. Uni hech kimga bermang va saytga kiriting:\n${siteUrl}/${purpose === "reset_password" ? "kirish" : "royxatdan-otish"}`,
      { remove_keyboard: true }
    );

    return NextResponse.json({ ok: true });
  }

  // Boshqa matn yuborilsa
  await sendTelegramMessage(
    botToken,
    chatId,
    "6 xonali tasdiqlash kodini olish uchun /start buyrug‘ini bosing va telefon raqamingizni ulashing.",
    {
      keyboard: [[{ text: "📱 Telefon raqamimni tasdiqlash", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  );

  return NextResponse.json({ ok: true });
}
