"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/db/server";
import { createSupabaseAdminClient } from "@/core/db/admin";
import { isSupabaseConfigured } from "@/core/db/env";
import { loginSchema, registerSchema, resetPasswordOtpSchema } from "@/core/validations/schemas";
import { normalizeUzPhone, phoneToAuthEmail } from "@/core/utils";
import { checkRateLimit, secureHash } from "@/core/security/rate-limit";

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
    telegram_code: formData.get("telegram_code") ? String(formData.get("telegram_code")) : null,
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

  // Telegram Bot yoqilgan bo'lsa — 6 xonali OTP va haqiqiy telefon raqami MAJBURIY tekshiriladi
  const telegramRequired = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  let verifiedTelegramUserId: number | null = null;
  let verificationRowId: string | null = null;

  if (telegramRequired) {
    const otp = (parsed.data.telegram_code || "").replace(/\D/g, "");
    if (otp.length !== 6) {
      return {
        ok: false,
        message: "Telegram botdan olingan 6 xonali tasdiqlash kodini kiriting.",
      };
    }
    if (!adminClient) {
      return { ok: false, message: "Serverda SUPABASE_SERVICE_ROLE_KEY sozlanmagan." };
    }

    const { data: otpRow } = await adminClient
      .from("telegram_verifications")
      .select("*")
      .eq("phone_hash", phoneHash)
      .eq("purpose", "register")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return {
        ok: false,
        message:
          "Ushbu telefon raqami uchun faol Telegram kodi topilmadi yoki muddati tugagan. Botda aynan shu raqamni ulashing.",
      };
    }

    if (otpRow.attempts >= 5) {
      return {
        ok: false,
        message: "Juda ko‘p noto‘g‘ri urinish. Telegram botdan yangi kod oling.",
      };
    }

    const expectedHash = secureHash(`${phoneHash}:${otp}`);
    if (otpRow.code_hash !== expectedHash) {
      await adminClient
        .from("telegram_verifications")
        .update({ attempts: (otpRow.attempts || 0) + 1 })
        .eq("id", otpRow.id);
      return { ok: false, message: "6 xonali Telegram tasdiqlash kodi noto‘g‘ri." };
    }

    // Bir Telegram akkauntdan bir nechta profil ochishni bloklash
    const { data: existingTg } = await adminClient
      .from("user_private_details")
      .select("user_id")
      .eq("telegram_user_id", otpRow.telegram_user_id)
      .maybeSingle();

    if (existingTg) {
      return {
        ok: false,
        message:
          "Ushbu Telegram akkaunt allaqachon boshqa profilga bog‘langan. Har bir o‘quvchi faqat 1 ta akkaunt yarata oladi.",
      };
    }

    verifiedTelegramUserId = otpRow.telegram_user_id;
    verificationRowId = otpRow.id;
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

  // Maxfiy telefon raqami va Telegram ID alohida qat'iy RLS jadvalga yoziladi
  await writer.from("user_private_details").insert({
    user_id: userId,
    phone_e164: phoneE164,
    phone_hash: phoneHash,
    identity_fingerprint: identityHash,
    telegram_user_id: verifiedTelegramUserId,
    telegram_verified_at: verifiedTelegramUserId ? new Date().toISOString() : null,
  });

  if (verificationRowId && adminClient) {
    await adminClient
      .from("telegram_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("id", verificationRowId);
  }

  if (verifiedTelegramUserId && adminClient) {
    try {
      await adminClient
        .from("telegram_bot_users")
        .update({ linked_user_id: userId })
        .eq("telegram_user_id", verifiedTelegramUserId);
    } catch {
      // Migration 0009 hali ishga tushmagan bo'lsa ham ro'yxatdan o'tish davom etadi
    }
  }

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

export async function updateOwnProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Ma’lumotlar bazasi ulanmagan." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tizimga kiring." };

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const gradeRaw = formData.get("grade");
  const grade = gradeRaw ? Number(gradeRaw) : null;
  const classLetter = String(formData.get("class_letter") || "").trim().slice(0, 4) || null;
  const bio = String(formData.get("bio") || "").trim().slice(0, 400) || null;

  if (firstName.length < 2 || lastName.length < 2) {
    return { ok: false, message: "Ism va familiya kamida 2 harfdan iborat bo‘lsin." };
  }
  if (grade !== null && (Number.isNaN(grade) || grade < 5 || grade > 11)) {
    return { ok: false, message: "Sinf 5 dan 11 gacha bo‘lishi kerak." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      grade,
      class_letter: classLetter,
      bio,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Profilni saqlashda xatolik: " + error.message };
  }

  revalidatePath("/kabinet");
  revalidatePath("/", "layout");
  return { ok: true, message: "Shaxsiy profil ma’lumotlari muvaffaqiyatli yangilandi!" };
}

export async function resetPasswordWithTelegramOtpAction(
  formData: FormData
): Promise<ActionResult> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`reset:${ip}`, 8, 10 * 60_000);
  if (!rl.allowed) {
    return {
      ok: false,
      message: `Juda ko‘p urinish. ${rl.retryAfterSeconds} soniyadan keyin urinib ko‘ring.`,
    };
  }

  const parsed = resetPasswordOtpSchema.safeParse({
    phone: String(formData.get("phone") || ""),
    telegram_code: String(formData.get("telegram_code") || ""),
    new_password: String(formData.get("new_password") || ""),
    confirm_password: String(formData.get("confirm_password") || ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message || "Ma’lumotlarni tekshirib qayta kiriting.",
    };
  }

  const phoneE164 = normalizeUzPhone(parsed.data.phone);
  if (!phoneE164) return { ok: false, message: "Telefon raqami noto‘g‘ri." };

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return { ok: false, message: "Server sozlamalari to‘liq emas." };
  }

  const phoneHash = secureHash(phoneE164);
  const { data: priv } = await adminClient
    .from("user_private_details")
    .select("user_id")
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (!priv) {
    return { ok: false, message: "Ushbu telefon raqami bilan ro‘yxatdan o‘tilgan hisob topilmadi." };
  }

  const { data: otpRow } = await adminClient
    .from("telegram_verifications")
    .select("*")
    .eq("phone_hash", phoneHash)
    .eq("purpose", "reset_password")
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) {
    return {
      ok: false,
      message: "Faol Telegram tiklash kodi topilmadi yoki muddati tugagan. Botdan yangi kod oling.",
    };
  }

  if (otpRow.attempts >= 5) {
    return { ok: false, message: "Juda ko‘p noto‘g‘ri urinish. Botdan yangi kod oling." };
  }

  const expectedHash = secureHash(`${phoneHash}:${parsed.data.telegram_code}`);
  if (otpRow.code_hash !== expectedHash) {
    await adminClient
      .from("telegram_verifications")
      .update({ attempts: (otpRow.attempts || 0) + 1 })
      .eq("id", otpRow.id);
    return { ok: false, message: "6 xonali Telegram kodi noto‘g‘ri." };
  }

  const { error } = await adminClient.auth.admin.updateUserById(priv.user_id, {
    password: parsed.data.new_password,
  });

  if (error) {
    return { ok: false, message: "Parolni yangilashda xatolik: " + error.message };
  }

  await adminClient
    .from("telegram_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("id", otpRow.id);

  return {
    ok: true,
    message: "Parolingiz muvaffaqiyatli yangilandi! Endi yangi parol bilan tizimga kiring.",
  };
}
