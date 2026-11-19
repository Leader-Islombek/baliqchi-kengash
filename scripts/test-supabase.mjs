import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("XATO: .env.local fayli topilmadi.");
  process.exit(1);
}

const envVars = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx > 0) {
    envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anon = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || url.includes("YOUR_PROJECT")) {
  console.error("XATO: NEXT_PUBLIC_SUPABASE_URL yoki ANON_KEY hali kiritilmagan.");
  process.exit(1);
}

const client = createClient(url, service && !service.includes("YOUR_") ? service : anon, {
  auth: { persistSession: false },
});

const checks = [
  ["schools", "61 ta maktab"],
  ["directions", "7 ta rasmiy yo'nalish"],
  ["groups", "8 ta boshqaruv guruhi"],
  ["ranking_settings", "Reyting mezonlari"],
  ["users", "Foydalanuvchilar"],
  ["projects", "Loyihalar"],
];

let failed = 0;
for (const [table, label] of checks) {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error(`[XATO] ${label} (${table}): ${error.message}`);
    failed++;
  } else {
    console.log(`[OK] ${label} (${table}): ${count ?? 0} ta yozuv`);
  }
}

process.exit(failed > 0 ? 1 : 0);
