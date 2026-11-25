import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envVars = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx > 0) envVars[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

const botToken = process.argv[2] || envVars.TELEGRAM_BOT_TOKEN;
const siteUrl = (process.argv[3] || "https://baliqchi-kengash.vercel.app").replace(/\/+$/, "");
const secret = envVars.TELEGRAM_WEBHOOK_SECRET || "";

if (!botToken) {
  console.error("Foydalanish: node scripts/setup-telegram-webhook.mjs <BOT_TOKEN> [SITE_URL]");
  process.exit(1);
}

const webhookUrl = `${siteUrl}/api/telegram/webhook`;
const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret || undefined,
    allowed_updates: ["message"],
  }),
});

const data = await res.json();
console.log("Webhook natijasi:", JSON.stringify(data, null, 2));

const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
const meData = await meRes.json();
if (meData.ok) {
  console.log(`Bot ulandi: @${meData.result.username} (${meData.result.first_name})`);
}
