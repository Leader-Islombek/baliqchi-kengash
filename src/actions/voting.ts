"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkRateLimit, secureHash } from "@/lib/security/rate-limit";

export interface VoteActionResult {
  ok: boolean;
  code: string;
  message: string;
  votesCount?: number;
}

/**
 * Haftalik atomar ovoz berish.
 * Server tomonida PostgreSQL `cast_weekly_vote` RPC funksiyasini chaqiradi.
 * ASOSIY QOIDA: Har bir tasdiqlangan o'quvchi haftasiga barcha 7 yo'nalish
 * bo'yicha JAMI 1 TA ovoz bera oladi.
 */
export async function castWeeklyVoteAction(projectId: string): Promise<VoteActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      code: "DB_NOT_CONFIGURED",
      message: "Ovoz berish uchun Supabase ma’lumotlar bazasi ulanishi talab etiladi.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || "local";
  const ua = hdrs.get("user-agent") || "unknown";

  const rl = checkRateLimit(`vote:${ip}`, 15, 60_000);
  if (!rl.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: `Juda ko‘p so‘rov yuborildi. ${rl.retryAfterSeconds} soniyadan keyin urinib ko‘ring.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: "SERVER_ERROR", message: "Server bilan ulanishda xatolik." };
  }

  const { data, error } = await supabase.rpc("cast_weekly_vote", {
    p_project_id: projectId,
    p_ip_hash: secureHash(ip),
    p_ua_hash: secureHash(ua),
  });

  if (error) {
    return {
      ok: false,
      code: "RPC_ERROR",
      message: error.message || "Ovoz berishda xatolik yuz berdi.",
    };
  }

  const result = data as {
    ok: boolean;
    code: string;
    message: string;
    votes_count?: number;
  };

  if (result.ok) {
    revalidatePath("/ovoz-berish");
    revalidatePath("/loyihalar");
    revalidatePath("/");
  }

  return {
    ok: result.ok,
    code: result.code,
    message: result.message,
    votesCount: result.votes_count,
  };
}
