"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/data/queries";
import { hasPermission } from "@/lib/auth/permissions";
import {
  announcementSchema,
  commentSchema,
  createProjectSchema,
  eventSchema,
  initiativeSchema,
  projectUpdateSchema,
  reportSchema,
} from "@/lib/validations/schemas";
import { normalizeTashkentDateTime, slugifyUz } from "@/lib/utils";
import type { ActionResult } from "./auth";

export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  if (!hasPermission(ctx, "project:create")) {
    return {
      ok: false,
      message:
        "Sizda to‘g‘ridan-to‘g‘ri loyiha joylash huquqi yo‘q. Shaxsiy kabinet orqali o‘z maktabingiz Kelajak Lideriga tashabbus yuborishingiz mumkin.",
    };
  }

  const parsed = createProjectSchema.safeParse({
    title: String(formData.get("title") || ""),
    direction_id: String(formData.get("direction_id") || ""),
    school_id: String(formData.get("school_id") || ctx.user.school_id || ""),
    problem_statement: String(formData.get("problem_statement") || ""),
    goal: String(formData.get("goal") || ""),
    proposed_solution: String(formData.get("proposed_solution") || ""),
    implementation_plan: String(formData.get("implementation_plan") || ""),
    expected_result: String(formData.get("expected_result") || ""),
    required_resources: String(formData.get("required_resources") || ""),
    duration_text: String(formData.get("duration_text") || ""),
    cover_image_url: String(formData.get("cover_image_url") || ""),
    submit_immediately: formData.get("submit_immediately") !== "false",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Loyiha maydonlarini to‘liq to‘ldiring.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const slug = `${slugifyUz(parsed.data.title)}-${Date.now().toString(36)}`;
  const initialStatus = parsed.data.submit_immediately ? "submitted" : "draft";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      slug,
      title: parsed.data.title,
      direction_id: parsed.data.direction_id,
      school_id: parsed.data.school_id,
      author_id: ctx.user.id,
      problem_statement: parsed.data.problem_statement,
      goal: parsed.data.goal,
      proposed_solution: parsed.data.proposed_solution,
      implementation_plan: parsed.data.implementation_plan,
      expected_result: parsed.data.expected_result,
      required_resources: parsed.data.required_resources,
      duration_text: parsed.data.duration_text,
      cover_image_url: parsed.data.cover_image_url || null,
      status: initialStatus,
    })
    .select("slug")
    .single();

  if (error) {
    return { ok: false, message: "Loyihani saqlashda xatolik: " + error.message };
  }

  revalidatePath("/loyihalar");
  revalidatePath("/kabinet");
  return {
    ok: true,
    message:
      initialStatus === "submitted"
        ? "Loyihangiz moderatsiya uchun muvaffaqiyatli yuborildi!"
        : "Loyiha qoralama sifatida saqlandi.",
    redirectTo: `/loyihalar/${data.slug}`,
  };
}

export async function addProjectUpdateAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };

  if (!hasPermission(ctx, "project:update_progress")) {
    return { ok: false, message: "Loyiha jarayonini yangilash huquqingiz yo‘q." };
  }

  const parsed = projectUpdateSchema.safeParse({
    project_id: String(formData.get("project_id") || ""),
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    progress_percent: formData.get("progress_percent"),
    results_achieved: formData.get("results_achieved")
      ? String(formData.get("results_achieved"))
      : null,
    challenges: formData.get("challenges") ? String(formData.get("challenges")) : null,
    show_on_homepage: formData.get("show_on_homepage") !== "false",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Ma’lumotlarni tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const mediaUrl = String(formData.get("media_url") || "").trim();

  const { error } = await supabase.from("project_updates").insert({
    project_id: parsed.data.project_id,
    author_id: ctx.user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    progress_percent: parsed.data.progress_percent,
    results_achieved: parsed.data.results_achieved,
    challenges: parsed.data.challenges,
    media_urls: mediaUrl ? [mediaUrl] : [],
    show_on_homepage: parsed.data.show_on_homepage,
  });

  if (error) return { ok: false, message: "Yangilanish qo‘shishda xatolik: " + error.message };

  revalidatePath("/");
  revalidatePath("/amalga-oshirilayotgan");
  revalidatePath("/loyihalar");
  return { ok: true, message: "Loyiha jarayoni muvaffaqiyatli yangilandi!" };
}

export async function addCommentAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Izoh qoldirish uchun tizimga kiring." };

  const parsed = commentSchema.safeParse({
    project_id: String(formData.get("project_id") || ""),
    content: String(formData.get("content") || ""),
    parent_id: formData.get("parent_id") ? String(formData.get("parent_id")) : null,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Izoh matnini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase.from("comments").insert({
    project_id: parsed.data.project_id,
    user_id: ctx.user.id,
    parent_id: parsed.data.parent_id || null,
    content: parsed.data.content,
  });

  if (error) return { ok: false, message: "Izoh qo‘shishda xatolik: " + error.message };

  revalidatePath("/loyihalar");
  return { ok: true, message: "Izohingiz muvaffaqiyatli qo‘shildi." };
}

export async function submitInitiativeAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };
  if (!ctx.user.school_id) return { ok: false, message: "Profilga maktab biriktirilmagan." };

  const parsed = initiativeSchema.safeParse({
    direction_id: String(formData.get("direction_id") || ""),
    title: String(formData.get("title") || ""),
    problem_summary: String(formData.get("problem_summary") || ""),
    idea_details: String(formData.get("idea_details") || ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Tashabbus maydonlarini to‘ldiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase.from("student_initiatives").insert({
    school_id: ctx.user.school_id,
    direction_id: parsed.data.direction_id,
    author_id: ctx.user.id,
    title: parsed.data.title,
    problem_summary: parsed.data.problem_summary,
    idea_details: parsed.data.idea_details,
  });

  if (error) return { ok: false, message: "Tashabbus yuborishda xatolik: " + error.message };

  revalidatePath("/kabinet");
  return {
    ok: true,
    message: "Tashabbusingiz maktabingiz Kelajak Lideriga muvaffaqiyatli yuborildi!",
  };
}

export async function submitReportAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };
  if (!hasPermission(ctx, "report:create")) {
    return { ok: false, message: "Hisobot topshirish huquqingiz yo‘q." };
  }

  const parsed = reportSchema.safeParse({
    project_id: formData.get("project_id") ? String(formData.get("project_id")) : null,
    school_id: formData.get("school_id") ? String(formData.get("school_id")) : ctx.user.school_id,
    direction_id: formData.get("direction_id") ? String(formData.get("direction_id")) : null,
    period_label: String(formData.get("period_label") || ""),
    summary: String(formData.get("summary") || ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Hisobot maydonlarini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase.from("project_reports").insert({
    project_id: parsed.data.project_id || null,
    school_id: parsed.data.school_id || ctx.user.school_id,
    direction_id: parsed.data.direction_id || null,
    author_id: ctx.user.id,
    period_label: parsed.data.period_label,
    summary: parsed.data.summary,
  });

  if (error) return { ok: false, message: "Hisobot saqlashda xatolik: " + error.message };

  revalidatePath("/kabinet");
  return { ok: true, message: "Faoliyat hisoboti muvaffaqiyatli yuborildi." };
}

export async function createEventAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };
  if (!hasPermission(ctx, "event:create")) {
    return { ok: false, message: "Tadbir joylash huquqingiz yo‘q." };
  }

  const parsed = eventSchema.safeParse({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    school_id: formData.get("school_id") ? String(formData.get("school_id")) : null,
    direction_id: formData.get("direction_id") ? String(formData.get("direction_id")) : null,
    location: String(formData.get("location") || ""),
    starts_at: String(formData.get("starts_at") || ""),
    ends_at: formData.get("ends_at") ? String(formData.get("ends_at")) : null,
    status: String(formData.get("status") || "planned"),
    cover_image_url: String(formData.get("cover_image_url") || ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Tadbir ma’lumotlarini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const slug = `${slugifyUz(parsed.data.title)}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("events").insert({
    slug,
    title: parsed.data.title,
    description: parsed.data.description,
    school_id: parsed.data.school_id || null,
    direction_id: parsed.data.direction_id || null,
    organizer_id: ctx.user.id,
    location: parsed.data.location,
    starts_at: normalizeTashkentDateTime(parsed.data.starts_at),
    ends_at: parsed.data.ends_at ? normalizeTashkentDateTime(parsed.data.ends_at) : null,
    status: parsed.data.status,
    cover_image_url: parsed.data.cover_image_url || null,
  });

  if (error) return { ok: false, message: "Tadbir yaratishda xatolik: " + error.message };

  revalidatePath("/tadbirlar");
  revalidatePath("/");
  return { ok: true, message: "Tadbir muvaffaqiyatli qo‘shildi!" };
}

export async function createAnnouncementAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getCurrentUserContext();
  if (!ctx) return { ok: false, message: "Tizimga kiring." };
  if (!hasPermission(ctx, "announcement:create")) {
    return { ok: false, message: "Yangilik yoki e’lon joylash huquqingiz yo‘q." };
  }

  const parsed = announcementSchema.safeParse({
    title: String(formData.get("title") || ""),
    excerpt: formData.get("excerpt") ? String(formData.get("excerpt")) : null,
    content: String(formData.get("content") || ""),
    category: String(formData.get("category") || "news"),
    scope: String(formData.get("scope") || "district"),
    school_id: formData.get("school_id") ? String(formData.get("school_id")) : null,
    direction_id: formData.get("direction_id") ? String(formData.get("direction_id")) : null,
    cover_image_url: String(formData.get("cover_image_url") || ""),
    is_pinned: formData.get("is_pinned") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Yangilik matnini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const slug = `${slugifyUz(parsed.data.title)}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("announcements").insert({
    slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt || parsed.data.content.slice(0, 180),
    content: parsed.data.content,
    category: parsed.data.category,
    scope: parsed.data.scope,
    school_id: parsed.data.school_id || null,
    direction_id: parsed.data.direction_id || null,
    author_id: ctx.user.id,
    cover_image_url: parsed.data.cover_image_url || null,
    is_pinned: parsed.data.is_pinned,
    is_published: true,
  });

  if (error) return { ok: false, message: "Yangilik saqlashda xatolik: " + error.message };

  revalidatePath("/yangiliklar");
  revalidatePath("/");
  return { ok: true, message: "Yangilik muvaffaqiyatli e’lon qilindi!" };
}
