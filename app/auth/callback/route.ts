import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdminAsync } from "@/lib/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email ?? "";

      // Enforce IIT domain
      if (!email.endsWith("@iit.ac.lk")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=domain`);
      }

      // TEMPORARY test mode: Google sign-in is admin-only
      if (
        process.env.NEXT_PUBLIC_TEST_MODE === "true" &&
        !(await isAdminAsync(email, supabase))
      ) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }

      // Upsert profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name ?? null,
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
