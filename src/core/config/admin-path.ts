import crypto from "node:crypto";

/**
 * Maxfiy Super Administrator paneli manzili (faqat server tomonida o'qiladi!).
 * Client JS bundle'ga hech qachon tushmaydi — faqat tasdiqlangan Super Admin sessiyasiga uzatiladi.
 * Istalgan payt Vercel Environment Variables orqali ADMIN_SECRET_SLUG ni o'zgartirish mumkin.
 */
const DEFAULT_ADMIN_SECRET_SLUG = "kengash-boshqaruv-markazi-9x4k7m2p8q6w3v";

export function getAdminSecretSlug(): string {
  const envSlug = process.env.ADMIN_SECRET_SLUG?.trim();
  if (envSlug && /^[a-zA-Z0-9_-]{16,120}$/.test(envSlug)) {
    return envSlug;
  }
  return DEFAULT_ADMIN_SECRET_SLUG;
}

export function getAdminPanelPath(): string {
  return `/panel/${getAdminSecretSlug()}`;
}

export function isValidAdminSecretSlug(candidate: string): boolean {
  const expected = getAdminSecretSlug();
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
