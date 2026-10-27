import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminAsync } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Unauthorized from "@/components/Unauthorized";
import SelectionsClient from "./SelectionsClient";

export default async function SelectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isAdminAsync(user.email!, supabase))) return <Unauthorized />;

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  const [{ data: apps }, { data: sels }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, name, email, contact_number, first_preference, second_preference, degree_pathway, volunteered_last_year, confidence_reason, second_preference_reason")
      .order("submitted_at", { ascending: true }),
    supabase
      .from("selections")
      .select("application_id, role, selected_by, selected_at"),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)" }}>
      <Navbar email={email} name={name} isAdmin={true} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Selections</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
            Review applicants per role and mark your selections.
          </p>
          <div className="gold-divider mt-3" />
        </div>
        <SelectionsClient
          applicants={(apps ?? []) as any}
          selections={sels ?? []}
        />
      </div>
    </div>
  );
}
