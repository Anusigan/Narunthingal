import type { SupabaseClient } from "@supabase/supabase-js";

// Fallback used by middleware (no DB call on every request).
// Keep this in sync with the admins table seed.
export const ADMIN_EMAILS: string[] = [
  "sivananthan.20230297@iit.ac.lk",
];

// Only this account can manage the admins list
export const SUPER_ADMIN_EMAIL = "sivananthan.20230297@iit.ac.lk";

export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(
    email.toLowerCase()
  );
}

export async function getAdminEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("admins").select("email");
  if (!data || data.length === 0) return ADMIN_EMAILS;
  return data.map((r: { email: string }) => r.email.toLowerCase());
}

export async function isAdminAsync(
  email: string | null | undefined,
  supabase: SupabaseClient
): Promise<boolean> {
  if (!email) return false;
  const admins = await getAdminEmails(supabase);
  return admins.includes(email.toLowerCase());
}
