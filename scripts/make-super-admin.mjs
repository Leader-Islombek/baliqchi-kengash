import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const phoneArg = process.argv[2];
if (!phoneArg) {
  console.error("Foydalanish: node scripts/make-super-admin.mjs +998901234567");
  process.exit(1);
}

const digits = phoneArg.replace(/\D/g, "");
const phoneE164 = digits.length === 9 ? `+998${digits}` : `+${digits}`;

const envPath = path.resolve(process.cwd(), ".env.local");
const envVars = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx > 0) envVars[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: priv, error: findErr } = await supabase
  .from("user_private_details")
  .select("user_id, phone_e164")
  .eq("phone_e164", phoneE164)
  .maybeSingle();

if (findErr || !priv) {
  console.error(`XATO: ${phoneE164} raqamli foydalanuvchi topilmadi. Avval /royxatdan-otish orqali ro'yxatdan o'ting.`);
  process.exit(1);
}

const { error: roleErr } = await supabase.from("user_roles").insert({
  user_id: priv.user_id,
  role: "super_admin",
  status: "approved",
  reviewed_at: new Date().toISOString(),
  request_note: "Birinchi Super Administrator sifatida tayinlandi",
});

if (roleErr) {
  console.error("Rol tayinlashda xato:", roleErr.message);
  process.exit(1);
}

await supabase
  .from("users")
  .update({ is_verified: true, can_submit_projects: true, account_status: "active" })
  .eq("id", priv.user_id);

console.log(`[MUVAFFAQIYAT] ${phoneE164} foydalanuvchisi Super Administrator qilib tayinlandi!`);
