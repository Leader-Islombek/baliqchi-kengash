import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

// 1. ALL_IN_ONE_SETUP.sql ni toza UTF-8 da qayta yaratish
const migDir = path.join(root, "supabase", "migrations");
const migFiles = fs
  .readdirSync(migDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const combined = migFiles
  .map((f) => {
    const body = fs.readFileSync(path.join(migDir, f), "utf8");
    return `\n-- =========================================================\n-- FILE: ${f}\n-- =========================================================\n${body}`;
  })
  .join("\n");

fs.writeFileSync(path.join(root, "supabase", "ALL_IN_ONE_SETUP.sql"), combined, "utf8");
console.log("[OK] ALL_IN_ONE_SETUP.sql toza UTF-8 formatda qayta yozildi.");

// 2. Supabase jonli bazadagi directions, groups, schools, platform_settings ni tozalash
const envVars = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
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

const CLEAN_DIRECTIONS = [
  {
    slug: "talim",
    name: "Ta’lim",
    short_name: "Ta’lim",
    description:
      "O‘quvchilarning o‘zlashtirish darajasini ko‘tarish, ta’lim sifatini oshirish, fan va til to‘garaklari hamda akademik tashabbuslarni rivojlantirish.",
    duties_summary:
      "Bilimli, a’lochi o‘quvchilar orasidan saylanadi. Fan va til to‘garaklari, dars sifati bo‘yicha so‘rovlar va rahbariyatga takliflar kiritishni tashkil etadi.",
  },
  {
    slug: "madaniyat",
    name: "Madaniyat",
    short_name: "Madaniyat",
    description:
      "Milliy urf-odat va qadriyatlarni asrab-avaylash, “Turon maktab teatri”, “Iqtidor maktab ansambli”, “Jadidlar izidan” tanlovlari hamda ijodiy tadbirlarni rivojlantirish.",
    duties_summary:
      "Iqtidorli va ijodkor o‘quvchilardan saylanadi. Madaniy tadbirlar, tarixiy obida va muzeylarga tashriflar, musiqa va san’at maktablariga yo‘naltirishni tashkil etadi.",
  },
  {
    slug: "it-va-suniy-intellekt",
    name: "IT va sun’iy intellekt",
    short_name: "IT va AI",
    description:
      "Kengash faoliyatini raqamlashtirish, zamonaviy platformalar, bot va saytlar yaratish, dasturlash va sun’iy intellekt to‘garaklarini rivojlantirish.",
    duties_summary:
      "Axborot texnologiyalari, sun’iy intellekt va dasturlashga qiziquvchi o‘quvchilardan saylanadi. “Kelajak” markazi tarmoq to‘garaklarini rivojlantirishga ko‘maklashadi.",
  },
  {
    slug: "sport",
    name: "Sport",
    short_name: "Sport",
    description:
      "O‘quvchilar o‘rtasida sportni keng targ‘ib qilish, ommalashtirish, sog‘lom turmush tarzini qaror toptirish va sport musobaqalarini tashkil etish.",
    duties_summary:
      "Sport bilan muntazam shug‘ullanadigan o‘quvchilardan saylanadi. Bolalar va o‘smirlar sport maktablariga yo‘naltirish va sport tadbirlarini muvofiqlashtiradi.",
  },
  {
    slug: "ekologiya",
    name: "Ekologiya",
    short_name: "Ekologiya",
    description:
      "Atrof-muhitni asrash, salomatlikni targ‘ib etish, chiqindilarni kamaytirish va qayta ishlash aksiyalari hamda “Eko-maktab” loyihalarini amalga oshirish.",
    duties_summary:
      "Tabiiy fanlar bo‘yicha bilimdon va faol jamoatchi o‘quvchilardan saylanadi. Ilmiy-amaliy konferensiyalar va ekologik aksiyalarni o‘tkazadi.",
  },
  {
    slug: "media",
    name: "Media",
    short_name: "Media",
    description:
      "Maktab hayoti va Kengash faoliyatini yoritish, bolalar jurnalistikasi, matbuot xizmati, gazeta, jurnal, sayt va maktab radiosi faoliyatini yo‘lga qo‘yish.",
    duties_summary:
      "Ijodkor, qalami o‘tkir va notiq o‘quvchilardan saylanadi. Media jamoasini shakllantiradi, yangilik va tahliliy materiallar tayyorlaydi.",
  },
  {
    slug: "ijtimoiy-tashabbus",
    name: "Ijtimoiy tashabbus",
    short_name: "Ijtimoiy tashabbus",
    description:
      "O‘quvchilarning ijtimoiy g‘oya va tashabbuslarini aniqlash, jamoatchilik faoliyatiga jalb etish, xayriya va foydali ijtimoiy loyihalarni amalga oshirish.",
    duties_summary:
      "Tashabbuskor va faol o‘quvchilardan saylanadi. Tashabbuskor yoshlarni birlashtirib, ijtimoiy loyihalarni tashkil etish va amalga oshirishni muvofiqlashtiradi.",
  },
];

for (const d of CLEAN_DIRECTIONS) {
  const { error } = await supabase
    .from("directions")
    .update({
      name: d.name,
      short_name: d.short_name,
      description: d.description,
      duties_summary: d.duties_summary,
    })
    .eq("slug", d.slug);
  if (error) console.error("Direction error:", d.slug, error.message);

  await supabase
    .from("groups")
    .update({
      name: `${d.name} koordinatori guruhi`,
      description: `Baliqchi tumanidagi 61 ta maktabning ${d.name} yo‘nalishi koordinatorlari va Tuman yo‘nalish koordinatori muloqot hamda topshiriqlar maydoni.`,
    })
    .eq("slug", `${d.slug}-koordinatorlari`);
}

await supabase
  .from("groups")
  .update({
    name: "Kelajak Liderlari guruhi",
    description:
      "Baliqchi tumani 1 nafar Tuman Kelajak Lideri va 61 nafar Maktab Kelajak Liderlarining mustaqil boshqaruv, e’lonlar, topshiriqlar va hisobotlar guruhi.",
  })
  .eq("slug", "kelajak-liderlari");

// 61 ta maktabni toza UTF-8 da yangilash
const schoolUpdates = Array.from({ length: 61 }, (_, i) => {
  const n = i + 1;
  return {
    school_number: n,
    slug: `maktab-${n}`,
    name: `${n}-sonli umumiy o‘rta ta’lim maktabi`,
    address: "Baliqchi tumani, Andijon viloyati",
    description: `Baliqchi tumani ${n}-sonli umumiy o‘rta ta’lim maktabi O‘quvchilar Kengashi raqamli profili.`,
  };
});

const { error: schoolErr } = await supabase
  .from("schools")
  .upsert(schoolUpdates, { onConflict: "school_number" });
if (schoolErr) console.error("Schools error:", schoolErr.message);

// platform_settings ni toza UTF-8 da yangilash
await supabase.from("platform_settings").upsert([
  {
    key: "site_meta",
    value: {
      name: "Baliqchi tumani O‘quvchilar Kengashi",
      region: "Baliqchi tumani, Andijon viloyati",
      schools_count: 61,
      slogan: "G‘oyadan — haqiqiy natijagacha: 61 maktab yoshlarining yagona tashabbus platformasi",
    },
    description: "Platformaning asosiy nomlanishi va shiori",
  },
  {
    key: "official_clubs",
    value: [
      "“Turon teatri” klubi",
      "“Iqtidor ansambli” klubi",
      "“Jadidlar izidan” klubi",
      "“Eco-Schools Uzbekistan” klubi",
      "“Kelajak uchun xorijiy til” klubi",
      "“Debat” klubi",
      "“Raqamli avlod qizlari” klubi",
    ],
    description: "365-son buyruq 2-ilovasidagi rasmiy 7 ta klub andozasi",
  },
  {
    key: "voting_rules",
    value: {
      votes_per_week: 1,
      require_verified_account: true,
      auto_approve_winner: false,
    },
    description: "Haftalik ovoz berish qoidalari (o‘zgartirish faqat Super Admin)",
  },
]);

// Yakuniy tekshiruv
const { data: checkDirs } = await supabase.from("directions").select("name").order("sort_order");
const { data: checkSchool } = await supabase.from("schools").select("name").eq("school_number", 1).single();
console.log("[OK] Yo'nalishlar:", checkDirs.map((x) => x.name).join(" | "));
console.log("[OK] 1-maktab:", checkSchool.name);
