import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, isSupabaseAdminConfigured } from "./env";

/**
 * FAQAT SERVER MUHITIDA ISHLATILADI!
 * Supabase Service Role Key hech qachon brauzerga uzatilmaydi.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin client faqat server muhitida ishlatilishi mumkin!");
  }
  if (!isSupabaseAdminConfigured()) {
    return null;
  }
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
