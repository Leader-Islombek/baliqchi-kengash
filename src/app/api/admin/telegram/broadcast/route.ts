import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserContext } from "@/core/db/queries";
import { createSupabaseAdminClient } from "@/core/db/admin";
import {
  getTelegramBotToken,
  sendTelegramMessage,
  sendTelegramPhoto,
} from "@/core/telegram/bot";

type BroadcastAudience = "all" | "registered" | "unregistered" | "school";

async function resolveSchoolUserIds(
  adminClient: SupabaseClient,
  schoolId: string
): Promise<string[]> {
  const { data } = await adminClient.from("users").select("id").eq("school_id", schoolId);
  return (data || []).map((r) => String(r.id));
}

async function fetchTargetSlice(
  adminClient: SupabaseClient,
  audience: BroadcastAudience,
  schoolId: string | null,
  afterTelegramId: number,
  limit: number
): Promise<number[]> {
  let query = adminClient
    .from("telegram_bot_users")
    .select("telegram_user_id")
    .eq("is_banned", false)
    .eq("is_blocked_by_user", false)
    .gt("telegram_user_id", afterTelegramId)
    .order("telegram_user_id", { ascending: true })
    .limit(limit);

  if (audience === "registered") {
    query = query.not("linked_user_id", "is", null);
  } else if (audience === "unregistered") {
    query = query.is("linked_user_id", null);
  } else if (audience === "school") {
    if (!schoolId) return [];
    const schoolUserIds = await resolveSchoolUserIds(adminClient, schoolId);
    if (schoolUserIds.length === 0) return [];
    query = query.in("linked_user_id", schoolUserIds);
  }

  const { data } = await query;
  return (data || []).map((r) => Number(r.telegram_user_id));
}

async function countTargets(
  adminClient: SupabaseClient,
  audience: BroadcastAudience,
  schoolId: string | null
): Promise<number> {
  let query = adminClient
    .from("telegram_bot_users")
    .select("telegram_user_id", { count: "exact", head: true })
    .eq("is_banned", false)
    .eq("is_blocked_by_user", false);

  if (audience === "registered") {
    query = query.not("linked_user_id", "is", null);
  } else if (audience === "unregistered") {
    query = query.is("linked_user_id", null);
  } else if (audience === "school") {
    if (!schoolId) return 0;
    const schoolUserIds = await resolveSchoolUserIds(adminClient, schoolId);
    if (schoolUserIds.length === 0) return 0;
    query = query.in("linked_user_id", schoolUserIds);
  }

  const { count } = await query;
  return count ?? 0;
}

export async function POST(request: Request) {
  const userCtx = await getCurrentUserContext();
  if (!userCtx || !userCtx.isSuperAdmin) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  if (!getTelegramBotToken()) {
    return NextResponse.json(
      { ok: false, message: "TELEGRAM_BOT_TOKEN sozlanmagan." },
      { status: 503 }
    );
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { ok: false, message: "Server bazasiga ulanishda xatolik." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Noto‘g‘ri so‘rov formati." }, { status: 400 });
  }

  const phase = String(body.phase || "");

  // =========================================================================
  // 1-BOSQICH: RASSILKANI BOSHLASH (Targetlar sonini hisoblash va yaratish)
  // =========================================================================
  if (phase === "start") {
    const audienceRaw = String(body.audience || "all");
    const audience: BroadcastAudience = (
      ["all", "registered", "unregistered", "school"].includes(audienceRaw) ? audienceRaw : "all"
    ) as BroadcastAudience;
    const schoolId = body.school_id ? String(body.school_id).trim() : null;
    const messageText = String(body.message_text || "").trim();
    const photoUrl = body.photo_url ? String(body.photo_url).trim() : null;
    const buttonText = body.button_text ? String(body.button_text).trim() : null;
    const buttonUrl = body.button_url ? String(body.button_url).trim() : null;

    if (messageText.length < 3) {
      return NextResponse.json(
        { ok: false, message: "Xabar matni kamida 3 belgidan iborat bo‘lishi kerak." },
        { status: 400 }
      );
    }

    if (audience === "school" && !schoolId) {
      return NextResponse.json(
        { ok: false, message: "Maktab auditoriyasi uchun maktabni tanlang." },
        { status: 400 }
      );
    }

    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      return NextResponse.json(
        { ok: false, message: "Rasm havolasi https:// bilan boshlanishi kerak." },
        { status: 400 }
      );
    }

    if ((buttonText && !buttonUrl) || (!buttonText && buttonUrl)) {
      return NextResponse.json(
        { ok: false, message: "Tugma qo‘shish uchun ham nomini, ham havolasini kiriting." },
        { status: 400 }
      );
    }

    if (buttonUrl && !/^https?:\/\//i.test(buttonUrl)) {
      return NextResponse.json(
        { ok: false, message: "Tugma havolasi https:// bilan boshlanishi kerak." },
        { status: 400 }
      );
    }

    const totalTargets = await countTargets(adminClient, audience, schoolId);
    if (totalTargets === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Tanlangan auditoriyada faol Telegram bot foydalanuvchilari topilmadi.",
        },
        { status: 400 }
      );
    }

    const { data: broadcast, error } = await adminClient
      .from("telegram_broadcasts")
      .insert({
        audience,
        school_id: audience === "school" ? schoolId : null,
        message_text: messageText,
        photo_url: photoUrl || null,
        button_text: buttonText || null,
        button_url: buttonUrl || null,
        total_targets: totalTargets,
        sent_count: 0,
        failed_count: 0,
        status: "sending",
        created_by: userCtx.user.id,
      })
      .select("id")
      .single();

    if (error || !broadcast) {
      return NextResponse.json(
        { ok: false, message: "Rassilka yaratishda xatolik: " + (error?.message || "") },
        { status: 500 }
      );
    }

    await adminClient.from("activity_logs").insert({
      actor_id: userCtx.user.id,
      action: "telegram_broadcast_started",
      entity_type: "telegram_broadcasts",
      entity_id: broadcast.id,
      new_data: { audience, schoolId, totalTargets },
    });

    return NextResponse.json({
      ok: true,
      broadcastId: broadcast.id,
      totalTargets,
    });
  }

  // =========================================================================
  // 2-BOSQICH: BATCH (20 tadan) YUBORISH — Vercel timeout bo'lmasligi uchun!
  // =========================================================================
  if (phase === "batch") {
    const broadcastId = String(body.broadcastId || "");
    const afterTelegramId = Number(body.afterTelegramId || 0);
    const batchSize = Math.min(25, Math.max(5, Number(body.batchSize || 20)));

    if (!broadcastId) {
      return NextResponse.json({ ok: false, message: "broadcastId majburiy." }, { status: 400 });
    }

    const { data: bc } = await adminClient
      .from("telegram_broadcasts")
      .select("*")
      .eq("id", broadcastId)
      .maybeSingle();

    if (!bc) {
      return NextResponse.json({ ok: false, message: "Rassilka topilmadi." }, { status: 404 });
    }

    const slice = await fetchTargetSlice(
      adminClient,
      bc.audience as BroadcastAudience,
      bc.school_id,
      afterTelegramId,
      batchSize
    );

    if (slice.length === 0) {
      await adminClient
        .from("telegram_broadcasts")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", broadcastId);

      return NextResponse.json({
        ok: true,
        done: true,
        batchSent: 0,
        batchFailed: 0,
        totalSent: bc.sent_count,
        totalFailed: bc.failed_count,
        nextAfterTelegramId: afterTelegramId,
      });
    }

    const replyMarkup =
      bc.button_text && bc.button_url
        ? { inline_keyboard: [[{ text: bc.button_text, url: bc.button_url }]] }
        : undefined;

    let batchSent = 0;
    let batchFailed = 0;
    const blockedIds: number[] = [];

    // Telegram rate-limitga tushmaslik uchun 5 tadan parallel kichik to'lqinlarda yuboramiz
    for (let i = 0; i < slice.length; i += 5) {
      const wave = slice.slice(i, i + 5);
      const results = await Promise.all(
        wave.map(async (tgId) => {
          const res = bc.photo_url
            ? await sendTelegramPhoto(tgId, bc.photo_url, bc.message_text, replyMarkup)
            : await sendTelegramMessage(tgId, bc.message_text, replyMarkup);
          return { tgId, res };
        })
      );

      for (const { tgId, res } of results) {
        if (res.ok) {
          batchSent += 1;
        } else {
          batchFailed += 1;
          if (res.error_code === 403) {
            blockedIds.push(tgId);
          }
        }
      }
    }

    if (blockedIds.length > 0) {
      await adminClient
        .from("telegram_bot_users")
        .update({ is_blocked_by_user: true })
        .in("telegram_user_id", blockedIds);
    }

    const nextAfterTelegramId = slice[slice.length - 1];
    const totalSent = Number(bc.sent_count || 0) + batchSent;
    const totalFailed = Number(bc.failed_count || 0) + batchFailed;
    const done = slice.length < batchSize;

    await adminClient
      .from("telegram_broadcasts")
      .update({
        sent_count: totalSent,
        failed_count: totalFailed,
        ...(done ? { status: "completed", completed_at: new Date().toISOString() } : {}),
      })
      .eq("id", broadcastId);

    return NextResponse.json({
      ok: true,
      done,
      batchSent,
      batchFailed,
      totalSent,
      totalFailed,
      nextAfterTelegramId,
    });
  }

  return NextResponse.json({ ok: false, message: "Noma’lum phase." }, { status: 400 });
}
