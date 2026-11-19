"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/data/queries";
import { groupMessageSchema } from "@/lib/validations/schemas";
import type { ActionResult } from "./auth";

export async function sendGroupMessageAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  const parsed = groupMessageSchema.safeParse({
    group_id: String(formData.get("group_id") || ""),
    message_type: String(formData.get("message_type") || "message"),
    title: formData.get("title") ? String(formData.get("title")) : null,
    content: String(formData.get("content") || ""),
    is_pinned: formData.get("is_pinned") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Xabar matnini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const attachmentUrl = String(formData.get("attachment_url") || "").trim();
  const attachmentName = String(formData.get("attachment_name") || "Biriktirilgan fayl").trim();
  const attachments = attachmentUrl ? [{ name: attachmentName, url: attachmentUrl }] : [];

  const { error } = await supabase.from("group_messages").insert({
    group_id: parsed.data.group_id,
    author_id: ctx.user.id,
    message_type: parsed.data.message_type,
    title: parsed.data.title || null,
    content: parsed.data.content,
    attachments,
    is_pinned: parsed.data.is_pinned,
  });

  if (error) {
    return { ok: false, message: "Xabar yuborishga ruxsat yo‘q yoki xatolik: " + error.message };
  }

  revalidatePath("/guruhlar");
  return { ok: true, message: "Xabar muvaffaqiyatli yuborildi." };
}

export async function togglePinGroupMessageAction(
  messageId: string,
  nextPinned: boolean
): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase
    .from("group_messages")
    .update({ is_pinned: nextPinned })
    .eq("id", messageId);

  if (error) return { ok: false, message: "Xabarni mahkamlashda xatolik: " + error.message };
  revalidatePath("/guruhlar");
  return { ok: true, message: nextPinned ? "Xabar pin qilindi." : "Pin olib tashlandi." };
}

export async function deleteGroupMessageAction(messageId: string): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase
    .from("group_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) return { ok: false, message: "Xabarni o‘chirishda xatolik: " + error.message };
  revalidatePath("/guruhlar");
  return { ok: true, message: "Xabar o‘chirildi." };
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  revalidatePath("/bildirishnomalar");
  return { ok: true, message: "O‘qilgan deb belgilandi." };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.user.id)
    .eq("is_read", false);

  revalidatePath("/bildirishnomalar");
  return { ok: true, message: "Barcha bildirishnomalar o‘qildi." };
}
