"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginSchema, registerSchema } from "@/lib/validations/schemas";
import { normalizeUzPhone, phoneToAuthEmail } from "@/lib/utils";
import { checkRateLimit, secureHash } from "@/lib/security/rate-limit";

export interface ActionResult {
  ok: boolean;
  message: string;
  redirectTo?: string;
}

export async function registerStudentAction(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase ulanishi hali sozlanmagan. .env.local faylida NEXT_PUBLIC_SUPABASE_URL va kalitlarni kiriting.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || "local";
  const limit = checkRateLimit(`register:${ip}`, 5, 10 * 60_000);
  if (!limit.allowed) {
    return {
      ok: false,
      message: `Juda ko‘p urinish. ${limit.retryAfterSeconds} soniyadan keyin qayta urinib ko‘ring.`,
    };
  }

  const raw = {
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    school_id: String(formData.get("school_id") || ""),
    grade: formData.get("grade"),
    phone: String(formData.get("phone") || ""),
    password: String(formData.get("password") || ""),
    confirm_password: String(formData.get("confirm_password") || ""),
    requested_role: String(formData.get("requested_role") || "student"),
    requested_direction_id: formData.get("requested_direction_id")
      ? String(formData.get("requested_direction_id"))
      : null,
    request_note: formData.get("request_note") ? String(formData.get("request_note")) : null,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Ma’lumotlarni tekshirib qayta kiriting.",
    };
  }

  const phoneE164 = normalizeUzPhone(parsed.data.phone);
  if (!phoneE164) {
    return { ok: false, message: "Telefon raqami noto‘g‘ri formatda." };
  }

  const phoneHash = secureHash(phoneE164);
  const identityHash = secureHash(
    `${parsed.data.first_name.toLowerCase()}|${parsed.data.last_name.toLowerCase()}|${parsed.data.school_id}|${parsed.data.grade}`
  );

  const adminClient = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Server ulanishida xatolik yuz berdi." };
  }

  // Dublikat telefon raqamini server tomonida tekshirish
  if (adminClient) {
    const { data: existingPhone } = await adminClient
      .from("user_private_details")
      .select("user_id")
      .eq("phone_hash", phoneHash)
      .maybeSingle();

    if (existingPhone) {
      return {
        ok: false,
        message:
          "Ushbu telefon raqami bilan akkaunt allaqachon ro‘yxatdan o‘tgan. Tizimga kirish sahifasidan foydalaning.",
      };
    }
  }

  const authEmail = phoneToAuthEmail(phoneE164);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: authEmail,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
      },
    },
  });

  if (signUpError || !signUpData.user) {
    return {
      ok: false,
      message:
        signUpError?.message?.includes("already registered")
          ? "Ushbu telefon raqami allaqachon ro‘yxatdan o‘tgan."
          : signUpError?.message || "Ro‘yxatdan o‘tishda xatolik yuz berdi.",
    };
  }

  const userId = signUpData.user.id;
  const writer = adminClient || supabase;

  const { error: profileError } = await writer.from("users").insert({
    id: userId,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    school_id: parsed.data.school_id,
    grade: parsed.data.grade,
    account_status: "active",
    is_verified: true,
  });

  if (profileError) {
    return { ok: false, message: "Profil yaratishda xatolik: " + profileError.message };
  }

  // Maxfiy telefon raqami alohida qat'iy RLS jadvalga yoziladi
  await writer.from("user_private_details").insert({
    user_id: userId,
    phone_e164: phoneE164,
    phone_hash: phoneHash,
    identity_fingerprint: identityHash,
  });

  // Barcha foydalanuvchilar oddiy o'quvchi roli bilan boshlaydi
  await writer.from("user_roles").insert({
    user_id: userId,
    role: "student",
    school_id: parsed.data.school_id,
    status: "approved",
  });

  // Agar maxsus lavozimga ariza topshirgan bo'lsa — administrator tasdiqlashi uchun pending holatda saqlanadi
  if (parsed.data.requested_role !== "student") {
    await writer.from("user_roles").insert({
      user_id: userId,
      role: parsed.data.requested_role,
      school_id: parsed.data.school_id,
      direction_id: parsed.data.requested_direction_id || null,
      status: "pending",
      request_note:
        parsed.data.request_note ||
        "Ro‘yxatdan o‘tish vaqtida yuborilgan rol arizasi",
    });

    await writer.from("notifications").insert({
      user_id: userId,
      type: "role_application_received",
      title: "Maxsus rol arizangiz qabul qilindi",
      body: "Arizangiz Super Administrator tomonidan ko‘rib chiqilgach, tegishli vakolatlar ochiladi.",
      link_url: "/kabinet",
    });
  }

  revalidatePath("/");
  return {
    ok: true,
    message:
      parsed.data.requested_role !== "student"
        ? "Ro‘yxatdan muvaffaqiyatli o‘tdingiz! Maxsus rol arizangiz administrator tasdiqlashi uchun yuborildi."
        : "Ro‘yxatdan muvaffaqiyatli o‘tdingiz! Shaxsiy kabinetingizga xush kelibsiz.",
    redirectTo: "/kabinet",
  };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Supabase hali ulanmagan. .env.local sozlamalarini tekshiring.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || "local";
  const limit = checkRateLimit(`login:${ip}`, 10, 5 * 60_000);
  if (!limit.allowed) {
    return {
      ok: false,
      message: `Juda ko‘p kirish urinishi. ${limit.retryAfterSeconds} soniyadan keyin urinib ko‘ring.`,
    };
  }

  const parsed = loginSchema.safeParse({
    phone: String(formData.get("phone") || ""),
    password: String(formData.get("password") || ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Telefon raqami yoki parol noto‘g‘ri.",
    };
  }

  const phoneE164 = normalizeUzPhone(parsed.data.phone);
  if (!phoneE164) {
    return { ok: false, message: "Telefon raqami noto‘g‘ri formatda." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Server ulanishida xatolik." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToAuthEmail(phoneE164),
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "Telefon raqami yoki parol noto‘g‘ri." };
  }

  const redirectPath = String(formData.get("redirect") || "/kabinet");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Tizimga muvaffaqiyatli kirdingiz!",
    redirectTo: redirectPath.startsWith("/") ? redirectPath : "/kabinet",
  };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
