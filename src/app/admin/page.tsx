import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Eski /admin manzili xavfsizlik maqsadida butunlay yopilgan (404).
 * Super Administrator faqat maxfiy uzun URL orqali kiradi.
 */
export default function LegacyAdminDisabledPage() {
  notFound();
}
