import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import VotingManager from "./VotingManager";
import type { VotingEvent, Vote } from "@/lib/types";

export default async function AdminVotingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect("/");

  const { data: events } = await supabase
    .from("voting_events")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: votes } = await supabase
    .from("votes")
    .select("*");

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Voting Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create voting events, manage candidates, and view results.
          </p>
        </div>
        <VotingManager
          userId={user.id}
          events={(events as VotingEvent[]) ?? []}
          votes={(votes as Vote[]) ?? []}
        />
      </div>
    </div>
  );
}
