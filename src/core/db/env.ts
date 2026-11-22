export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
      anonKey &&
      url.startsWith("http") &&
      !url.includes("YOUR_PROJECT_ID") &&
      !anonKey.includes("YOUR_SUPABASE")
  );
}

export function isSupabaseAdminConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return (
    isSupabaseConfigured() &&
    Boolean(serviceKey && !serviceKey.includes("YOUR_SUPABASE"))
  );
}

export function getSupabasePublicEnv() {
  return {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
    anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim(),
  };
}
