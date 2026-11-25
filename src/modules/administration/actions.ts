"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/core/db/server";
import { createSupabaseAdminClient } from "@/core/db/admin";
import { getCurrentUserContext } from "@/core/db/queries";
import { rankingWeightsSchema, votingWeekSchema } from "@/core/validations/schemas";
import { normalizeTashkentDateTime, slugifyUz } from "@/core/utils";
import type { AppRole, ProjectStatus, RankingPeriod } from "@/core/types/database";
import type { ActionResult } from "@/modules/accounts/actions";

async function requireSuperAdmin() {
  const ctx = await getCurrentUserContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return null;
  }
  return ctx;
}

async function logAdminAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  newData: Record<string, unknown>
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: newData,
  });
}

// 1. ROL ARIZASINI TASDIQLASH YOKI RAD ETISH
export async function adminReviewRoleRequestAction(
  roleRequestId: string,
  decision: "approved" | "rejected"
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { data: reqRow, error: fetchErr } = await supabase
    .from("user_roles")
    .select("*")
    .eq("id", roleRequestId)
    .single();

  if (fetchErr || !reqRow) return { ok: false, message: "Ariza topilmadi." };

  const { error } = await supabase
    .from("user_roles")
    .update({
      status: decision,
      reviewed_by: admin.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", roleRequestId);

  if (error) return { ok: false, message: error.message };

  if (
    decision === "approved" &&
    [
      "school_coordinator",
      "school_leader",
      "district_coordinator",
      "district_leader",
      "school_advisor",
    ].includes(reqRow.role)
  ) {
    // Oldingi bir xil lavozimdagi aktiv yozuvni arxivga olish (agar o'rin band bo'lsa)
    if (reqRow.role === "district_leader") {
      await supabase
        .from("coordinators")
        .update({ is_active: false })
        .eq("role", "district_leader")
        .eq("is_active", true);
    } else if (reqRow.role === "district_coordinator" && reqRow.direction_id) {
      await supabase
        .from("coordinators")
        .update({ is_active: false })
        .eq("role", "district_coordinator")
        .eq("direction_id", reqRow.direction_id)
        .eq("is_active", true);
    } else if (reqRow.role === "school_leader" && reqRow.school_id) {
      await supabase
        .from("coordinators")
        .update({ is_active: false })
        .eq("role", "school_leader")
        .eq("school_id", reqRow.school_id)
        .eq("is_active", true);
    } else if (reqRow.role === "school_coordinator" && reqRow.school_id && reqRow.direction_id) {
      await supabase
        .from("coordinators")
        .update({ is_active: false })
        .eq("role", "school_coordinator")
        .eq("school_id", reqRow.school_id)
        .eq("direction_id", reqRow.direction_id)
        .eq("is_active", true);
    }

    await supabase.from("coordinators").insert({
      user_id: reqRow.user_id,
      role: reqRow.role,
      school_id: reqRow.school_id,
      direction_id: reqRow.direction_id,
      is_active: true,
    });
  }

  await supabase.from("notifications").insert({
    user_id: reqRow.user_id,
    type: "role_review_result",
    title:
      decision === "approved"
        ? "Lavozim arizangiz tasdiqlandi!"
        : "Lavozim arizangiz rad etildi",
    body:
      decision === "approved"
        ? "Sizga yangi vakolatlar va tegishli boshqaruv guruhlari ochildi."
        : "Qo‘shimcha ma’lumot uchun tuman administratori bilan bog‘laning.",
    link_url: "/kabinet",
  });

  await logAdminAudit(admin.user.id, `role_request_${decision}`, "user_roles", roleRequestId, {
    user_id: reqRow.user_id,
    role: reqRow.role,
  });

  revalidatePath("/admin");
  revalidatePath("/koordinatorlar");
  revalidatePath("/kelajak-liderlari");
  return {
    ok: true,
    message: decision === "approved" ? "Rol tasdiqlandi va guruhga biriktirildi." : "Ariza rad etildi.",
  };
}

// 2. ISTALGAN FOYDALANUVCHIGA TO'G'RIDAN-TO'G'RI ROL TAYINLASH (Super Admin cheksiz nazorati)
export async function adminAssignRoleDirectlyAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "student") as AppRole;
  const schoolId = formData.get("school_id") ? String(formData.get("school_id")) : null;
  const directionId = formData.get("direction_id") ? String(formData.get("direction_id")) : null;

  if (!userId) return { ok: false, message: "Foydalanuvchini tanlang." };

  // Majburiy maydonlarni tekshirish
  if ((role === "district_coordinator" || role === "school_coordinator") && !directionId) {
    return { ok: false, message: "Koordinator lavozimi uchun yo‘nalishni tanlang." };
  }
  if ((role === "school_leader" || role === "school_coordinator" || role === "school_advisor") && !schoolId) {
    return { ok: false, message: "Maktab darajasidagi lavozim uchun maktabni tanlang." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const nowIso = new Date().toISOString();
  const isCouncilRole = [
    "school_coordinator",
    "school_leader",
    "district_coordinator",
    "district_leader",
    "school_advisor",
  ].includes(role);

  // 1) Foydalanuvchining oldingi Kengash lavozimlarini avtomatik bekor qilish (super_admin dan tashqari)
  if (role !== "super_admin") {
    await supabase
      .from("coordinators")
      .update({ is_active: false, term_end: nowIso })
      .eq("user_id", userId)
      .eq("is_active", true);

    await supabase
      .from("user_roles")
      .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
      .eq("user_id", userId)
      .eq("status", "approved")
      .not("role", "in", '("student","super_admin")');
  }

  // 2) Yangi lavozim o'rnida oldin boshqa odam turgan bo'lsa, uni avtomatik bo'shatish
  if (role === "district_leader") {
    const { data: oldHolders } = await supabase
      .from("coordinators")
      .select("user_id")
      .eq("role", "district_leader")
      .eq("is_active", true);

    await supabase
      .from("coordinators")
      .update({ is_active: false, term_end: nowIso })
      .eq("role", "district_leader")
      .eq("is_active", true);

    for (const h of oldHolders || []) {
      await supabase
        .from("user_roles")
        .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
        .eq("user_id", h.user_id)
        .eq("role", "district_leader")
        .eq("status", "approved");
    }
  } else if (role === "district_coordinator" && directionId) {
    const { data: oldHolders } = await supabase
      .from("coordinators")
      .select("user_id")
      .eq("role", "district_coordinator")
      .eq("direction_id", directionId)
      .eq("is_active", true);

    await supabase
      .from("coordinators")
      .update({ is_active: false, term_end: nowIso })
      .eq("role", "district_coordinator")
      .eq("direction_id", directionId)
      .eq("is_active", true);

    for (const h of oldHolders || []) {
      await supabase
        .from("user_roles")
        .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
        .eq("user_id", h.user_id)
        .eq("role", "district_coordinator")
        .eq("direction_id", directionId)
        .eq("status", "approved");
    }
  } else if (role === "school_leader" && schoolId) {
    const { data: oldHolders } = await supabase
      .from("coordinators")
      .select("user_id")
      .eq("role", "school_leader")
      .eq("school_id", schoolId)
      .eq("is_active", true);

    await supabase
      .from("coordinators")
      .update({ is_active: false, term_end: nowIso })
      .eq("role", "school_leader")
      .eq("school_id", schoolId)
      .eq("is_active", true);

    for (const h of oldHolders || []) {
      await supabase
        .from("user_roles")
        .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
        .eq("user_id", h.user_id)
        .eq("role", "school_leader")
        .eq("school_id", schoolId)
        .eq("status", "approved");
    }
  } else if (role === "school_coordinator" && schoolId && directionId) {
    const { data: oldHolders } = await supabase
      .from("coordinators")
      .select("user_id")
      .eq("role", "school_coordinator")
      .eq("school_id", schoolId)
      .eq("direction_id", directionId)
      .eq("is_active", true);

    await supabase
      .from("coordinators")
      .update({ is_active: false, term_end: nowIso })
      .eq("role", "school_coordinator")
      .eq("school_id", schoolId)
      .eq("direction_id", directionId)
      .eq("is_active", true);

    for (const h of oldHolders || []) {
      await supabase
        .from("user_roles")
        .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
        .eq("user_id", h.user_id)
        .eq("role", "school_coordinator")
        .eq("school_id", schoolId)
        .eq("direction_id", directionId)
        .eq("status", "approved");
    }
  }

  // 3) Yangi rol yozish (oddiy o'quvchiga tushirilgan bo'lsa student roli allaqachon mavjud)
  if (role !== "student") {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
      school_id: schoolId || null,
      direction_id: directionId || null,
      status: "approved",
      reviewed_by: admin.user.id,
      reviewed_at: nowIso,
    });
    if (error) return { ok: false, message: "Rol yozishda xatolik: " + error.message };
  }

  // 4) Coordinators jadvaliga kiritish va xatolikni tekshirish
  if (isCouncilRole) {
    const { error: coordErr } = await supabase.from("coordinators").insert({
      user_id: userId,
      role,
      school_id: schoolId || null,
      direction_id: directionId || null,
      is_active: true,
    });
    if (coordErr) {
      return { ok: false, message: "Lavozimni faollashtirishda xatolik: " + coordErr.message };
    }
  }

  await logAdminAudit(admin.user.id, "direct_role_assign", "users", userId, {
    role,
    schoolId,
    directionId,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/koordinatorlar");
  revalidatePath("/kelajak-liderlari");
  revalidatePath("/maktablar");
  revalidatePath("/yonalishlar");
  revalidatePath("/kabinet");
  revalidatePath("/guruhlar");
  return {
    ok: true,
    message:
      role === "student"
        ? "Foydalanuvchi lavozimdan olindi va oddiy o‘quvchi maqomiga o‘tkazildi."
        : "Rol muvaffaqiyatli tayinlandi (oldingi lavozim avtomatik yangilandi)!",
  };
}

// 2B. AKTIV KOORDINATOR / LIDERNI LAVOZIMDAN OLISH (1 klikda)
export async function adminRevokeCoordinatorAction(coordinatorId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { data: coord } = await supabase
    .from("coordinators")
    .select("*")
    .eq("id", coordinatorId)
    .maybeSingle();

  if (!coord) return { ok: false, message: "Tayinlov topilmadi." };

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("coordinators")
    .update({ is_active: false, term_end: nowIso })
    .eq("id", coordinatorId);

  if (error) return { ok: false, message: error.message };

  await supabase
    .from("user_roles")
    .update({ status: "revoked", reviewed_by: admin.user.id, reviewed_at: nowIso })
    .eq("user_id", coord.user_id)
    .eq("role", coord.role)
    .eq("status", "approved");

  await logAdminAudit(admin.user.id, "revoke_coordinator", "coordinators", coordinatorId, {
    user_id: coord.user_id,
    role: coord.role,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/koordinatorlar");
  revalidatePath("/kelajak-liderlari");
  revalidatePath("/maktablar");
  revalidatePath("/yonalishlar");
  revalidatePath("/kabinet");
  return { ok: true, message: "Lavozim bekor qilindi va bo‘shatildi." };
}

// 3. FOYDALANUVCHI HOLATI VA QO'SHIMCHA VAKOLATLARINI BOSHQARISH
export async function adminUpdateUserControlAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const userId = String(formData.get("user_id") || "");
  const accountStatus = String(formData.get("account_status") || "active");
  const isVerified = formData.get("is_verified") === "true";
  const canSubmitProjects = formData.get("can_submit_projects") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase
    .from("users")
    .update({
      account_status: accountStatus,
      is_verified: isVerified,
      can_submit_projects: canSubmitProjects,
    })
    .eq("id", userId);

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "update_user_controls", "users", userId, {
    accountStatus,
    isVerified,
    canSubmitProjects,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Foydalanuvchi sozlamalari yangilandi." };
}

// 4. LOYIHANI ISTALGAN HOLATGA O'TKAZISH, HAFTAGA BIRIKTIRISH, MODERATSIYA
export async function adminUpdateProjectAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const projectId = String(formData.get("project_id") || "");
  const status = String(formData.get("status") || "moderation") as ProjectStatus;
  const votingWeekId = formData.get("voting_week_id")
    ? String(formData.get("voting_week_id"))
    : null;
  const progressPercent = Number(formData.get("progress_percent") ?? 0);
  const moderationNote = formData.get("moderation_note")
    ? String(formData.get("moderation_note"))
    : null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase
    .from("projects")
    .update({
      status,
      voting_week_id: votingWeekId || null,
      progress_percent: Math.min(100, Math.max(0, progressPercent)),
      moderation_note: moderationNote,
      reviewed_by: admin.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "update_project_admin", "projects", projectId, {
    status,
    votingWeekId,
    progressPercent,
    moderationNote,
  });

  revalidatePath("/admin");
  revalidatePath("/loyihalar");
  revalidatePath("/ovoz-berish");
  revalidatePath("/amalga-oshirilayotgan");
  revalidatePath("/");
  return { ok: true, message: "Loyiha holati muvaffaqiyatli yangilandi." };
}

export async function adminDeleteProjectAction(projectId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "delete_project", "projects", projectId, {});
  revalidatePath("/admin");
  revalidatePath("/loyihalar");
  return { ok: true, message: "Loyiha butunlay o‘chirildi." };
}

// 5. 61 TA MAKTABNI TAHRIRLASH / QO'SHISH
export async function adminUpsertSchoolAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const schoolId = formData.get("id") ? String(formData.get("id")) : null;
  const schoolNumber = Number(formData.get("school_number") || 0);
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!schoolNumber || !name) {
    return { ok: false, message: "Maktab raqami va nomi majburiy." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  if (schoolId && !schoolId.startsWith("school-")) {
    const { error } = await supabase
      .from("schools")
      .update({ school_number: schoolNumber, name, address, description })
      .eq("id", schoolId);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("schools").upsert(
      {
        school_number: schoolNumber,
        name,
        slug: `maktab-${schoolNumber}`,
        address: address || "Baliqchi tumani, Andijon viloyati",
        description: description || `${name} O‘quvchilar Kengashi profili.`,
      },
      { onConflict: "school_number" }
    );
    if (error) return { ok: false, message: error.message };
  }

  await logAdminAudit(admin.user.id, "upsert_school", "schools", schoolId, {
    schoolNumber,
    name,
  });

  revalidatePath("/admin");
  revalidatePath("/maktablar");
  return { ok: true, message: "Maktab ma’lumotlari saqlandi." };
}

// 6. YANGI YO'NALISH QO'SHISH (Kengaytiriluvchanlik)
export async function adminCreateDirectionAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const accentColor = String(formData.get("accent_color") || "blue");
  if (!name || !description) return { ok: false, message: "Yo‘nalish nomi va tavsifi majburiy." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const slug = slugifyUz(name);
  const { data: dir, error } = await supabase
    .from("directions")
    .insert({
      slug,
      name,
      short_name: name,
      description,
      accent_color: accentColor,
      sort_order: 20,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  // Yangi yo'nalish uchun avtomatik boshqaruv guruhi ham yaratiladi
  await supabase.from("groups").insert({
    slug: `${slug}-koordinatorlari`,
    name: `${name} koordinatori guruhi`,
    description: `61 ta maktabning ${name} koordinatorlari muloqot guruhi.`,
    group_type: "direction",
    direction_id: dir.id,
  });

  await logAdminAudit(admin.user.id, "create_direction", "directions", dir.id, { name });
  revalidatePath("/admin");
  revalidatePath("/yonalishlar");
  return { ok: true, message: "Yangi yo‘nalish va uning boshqaruv guruhi yaratildi!" };
}

// 7. HAFTALIK OVOZ BERISH SIKLINI BOSHQARISH VA YAKUNLASH
export async function adminCreateVotingWeekAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const parsed = votingWeekSchema.safeParse({
    week_code: String(formData.get("week_code") || ""),
    title: String(formData.get("title") || ""),
    description: formData.get("description") ? String(formData.get("description")) : null,
    starts_at: String(formData.get("starts_at") || ""),
    ends_at: String(formData.get("ends_at") || ""),
    status: String(formData.get("status") || "upcoming"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Hafta ma’lumotlarini tekshiring." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const normalizedPayload = {
    ...parsed.data,
    starts_at: normalizeTashkentDateTime(parsed.data.starts_at),
    ends_at: normalizeTashkentDateTime(parsed.data.ends_at),
  };

  if (normalizedPayload.status === "active") {
    await supabase.from("voting_weeks").update({ status: "closed" }).eq("status", "active");
  }

  const { data, error } = await supabase
    .from("voting_weeks")
    .insert(normalizedPayload)
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(
    admin.user.id,
    "create_voting_week",
    "voting_weeks",
    data.id,
    normalizedPayload
  );
  revalidatePath("/admin");
  revalidatePath("/ovoz-berish");
  revalidatePath("/");
  return { ok: true, message: "Yangi ovoz berish haftasi yaratildi (O‘zbekiston vaqti +05:00)!" };
}

export async function adminSetVotingWeekStatusAction(
  weekId: string,
  nextStatus: "upcoming" | "active" | "closed"
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const updatePayload: Record<string, string> = { status: nextStatus };
  if (nextStatus === "active") {
    await supabase
      .from("voting_weeks")
      .update({ status: "closed" })
      .eq("status", "active")
      .neq("id", weekId);

    const { data: existingWeek } = await supabase
      .from("voting_weeks")
      .select("starts_at")
      .eq("id", weekId)
      .maybeSingle();

    if (existingWeek?.starts_at && new Date(existingWeek.starts_at).getTime() > Date.now()) {
      updatePayload.starts_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("voting_weeks")
    .update(updatePayload)
    .eq("id", weekId);

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "update_voting_week_status", "voting_weeks", weekId, {
    nextStatus,
  });

  revalidatePath("/admin");
  revalidatePath("/ovoz-berish");
  revalidatePath("/");
  return {
    ok: true,
    message:
      nextStatus === "active"
        ? "Ovoz berish haftasi faollashtirildi!"
        : `Hafta holati "${nextStatus}" ga o‘zgartirildi.`,
  };
}

export async function adminDeleteVotingWeekAction(weekId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase.from("voting_weeks").delete().eq("id", weekId);
  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "delete_voting_week", "voting_weeks", weekId, {});
  revalidatePath("/admin");
  revalidatePath("/ovoz-berish");
  revalidatePath("/");
  return { ok: true, message: "Ovoz berish haftasi o‘chirildi." };
}

export async function adminFinalizeVotingWeekAction(
  weekId: string,
  overrideWinnerProjectId?: string | null,
  tieNote?: string | null
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { data, error } = await supabase.rpc("finalize_voting_week", {
    p_week_id: weekId,
    p_override_winner_project_id: overrideWinnerProjectId || null,
    p_tie_note: tieNote || null,
  });

  if (error) return { ok: false, message: error.message };

  const res = data as { ok: boolean; message?: string; winner_title?: string };
  revalidatePath("/admin");
  revalidatePath("/ovoz-berish");
  revalidatePath("/goliblar");
  return {
    ok: res.ok,
    message: res.ok
      ? `Hafta yakunlandi! G‘olib: "${res.winner_title}". Loyiha tuman ko‘rib chiqishiga yuborildi.`
      : res.message || "Haftani yakunlashda xatolik.",
  };
}

// 8. REYTING MEZONLARINI SOZLASH VA QAYTA HISOBLASH
export async function adminUpdateRankingWeightsAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const parsed = rankingWeightsSchema.safeParse({
    completed_projects_weight: formData.get("completed_projects_weight"),
    in_progress_projects_weight: formData.get("in_progress_projects_weight"),
    events_weight: formData.get("events_weight"),
    reports_weight: formData.get("reports_weight"),
    direction_activity_weight: formData.get("direction_activity_weight"),
    participation_weight: formData.get("participation_weight"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Reyting koeffitsiyentlari noto‘g‘ri kiritilgan." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const { error } = await supabase
    .from("ranking_settings")
    .upsert({ id: 1, ...parsed.data, updated_by: admin.user.id, updated_at: new Date().toISOString() });

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "update_ranking_weights", "ranking_settings", null, parsed.data);
  revalidatePath("/admin");
  revalidatePath("/reyting");
  return { ok: true, message: "Reyting mezonlari yangilandi!" };
}

export async function adminRecalculateRankingsAction(
  periodType: RankingPeriod = "overall"
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const now = new Date();
  const periodKey =
    periodType === "weekly"
      ? `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`
      : periodType === "monthly"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : "all-time";

  const { error } = await supabase.rpc("recalculate_school_rankings", {
    p_period_type: periodType,
    p_period_key: periodKey,
  });

  if (error) return { ok: false, message: error.message };

  await logAdminAudit(admin.user.id, "recalculate_rankings", "school_rankings", null, {
    periodType,
    periodKey,
  });

  revalidatePath("/reyting");
  revalidatePath("/");
  return { ok: true, message: `61 ta maktab reytingi (${periodType}) muvaffaqiyatli qayta hisoblandi!` };
}

// 9. FOYDALANUVCHI PAROLINI TIKLASH (Super Admin — Supabase Admin API orqali)
export async function adminResetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: "Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak." };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      message: "Serverda SUPABASE_SERVICE_ROLE_KEY sozlanmagan.",
    };
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { ok: false, message: "Parolni yangilashda xatolik: " + error.message };
  }

  await logAdminAudit(admin.user.id, "reset_user_password", "users", userId, {
    reset_at: new Date().toISOString(),
  });

  return { ok: true, message: "Foydalanuvchi paroli muvaffaqiyatli yangilandi!" };
}

// 10. FOYDALANUVCHI PROFILINI BUTUNLAY O'CHIRISH (Super Admin)
export async function adminDeleteUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) return { ok: false, message: "Faqat Super Administrator ruxsatiga ega." };

  if (!userId) return { ok: false, message: "Foydalanuvchi ID topilmadi." };
  if (userId === admin.user.id) {
    return {
      ok: false,
      message: "Xavfsizlik sababli o‘zingizning faol Super Admin profilingizni o‘chira olmaysiz.",
    };
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      message: "Serverda SUPABASE_SERVICE_ROLE_KEY sozlanmagan.",
    };
  }

  // Audit uchun o'chirilayotgan foydalanuvchi nomini olish
  const { data: targetUser } = await adminClient
    .from("users")
    .select("first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  // ON DELETE RESTRICT bo'lgan yozuvlarni avval xavfsiz tozalash
  await adminClient.from("project_updates").delete().eq("author_id", userId);
  await adminClient.from("project_reports").delete().eq("author_id", userId);
  await adminClient.from("projects").delete().eq("author_id", userId);
  await adminClient.from("events").delete().eq("organizer_id", userId);
  await adminClient.from("announcements").delete().eq("author_id", userId);

  // Supabase Auth foydalanuvchisini o'chirish (public.users va qolgan bog'liq jadvallar CASCADE bo'ladi)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, message: "Profilni o‘chirishda xatolik: " + error.message };
  }

  await logAdminAudit(admin.user.id, "delete_user_profile", "users", null, {
    deleted_user_id: userId,
    deleted_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : userId,
  });

  revalidatePath("/admin");
  revalidatePath("/koordinatorlar");
  revalidatePath("/kelajak-liderlari");
  revalidatePath("/");
  return { ok: true, message: "Foydalanuvchi profili butunlay o‘chirildi!" };
}
