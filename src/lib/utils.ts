import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * O'zbekiston telefon raqamini +998XXXXXXXXX formatiga keltiradi.
 */
export function normalizeUzPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Telefon raqamini ichki Supabase Auth login email identifikatoriga aylantiradi
 * (hech qachon ommaga ko'rsatilmaydi).
 */
export function phoneToAuthEmail(phoneE164: string): string {
  const clean = phoneE164.replace(/\D/g, "");
  const rawDomain = (process.env.AUTH_PHONE_DOMAIN || "baliqchi-kengash.uz")
    .trim()
    .replace(/^=+/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim()
    .toLowerCase();

  const domain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(rawDomain)
    ? rawDomain
    : "baliqchi-kengash.uz";

  return `u${clean}@${domain}`;
}

/**
 * O'zbek tilidagi matndan xavfsiz URL slug yaratadi.
 */
export function slugifyUz(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/o['‘’`ʻ]/g, "o")
    .replace(/g['‘’`ʻ]/g, "g")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized || "yozuv";
}

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

export function formatUzDate(dateInput: string | Date | null | undefined, withTime = false): string {
  if (!dateInput) return "—";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  if (!withTime) {
    return `${day}-${month}, ${year}`;
  }
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month}, ${year} • ${hh}:${mm}`;
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName || "").trim()[0] || "";
  const l = (lastName || "").trim()[0] || "";
  return (f + l).toUpperCase() || "OK";
}

/**
 * HTML <input type="datetime-local"> dan kelgan vaqtni O'zbekiston vaqti (+05:00)
 * bilan ISO timestamptz formatiga o'tkazadi.
 */
export function normalizeTashkentDateTime(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  // Agar allaqachon Z yoki +HH:MM / -HH:MM bo'lsa o'zgartirmaymiz
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // YYYY-MM-DDTHH:mm -> YYYY-MM-DDTHH:mm:00+05:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00+05:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}+05:00`;
  }
  return trimmed;
}
