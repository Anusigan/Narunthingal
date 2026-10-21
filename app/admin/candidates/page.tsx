import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import CandidatesTable from "./CandidatesTable";
import type { Application } from "@/lib/types";

export default async function CandidatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect("/");

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .order("submitted_at", { ascending: false });

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Applications</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
              {applications?.length ?? 0} total submissions
            </p>
            <div className="gold-divider mt-3" />
          </div>
        </div>

        <CandidatesTable applications={(applications as Application[]) ?? []} />
      </div>
    </div>
  );
}
