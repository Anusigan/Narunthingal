import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import VoteBallot from "./VoteBallot";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { isAdminAsync } from "@/lib/admin";
import type { VotingEvent, Vote } from "@/lib/types";

export default async function VotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;
  const admin = await isAdminAsync(email, supabase);

  if (!admin) {
    return (
      <div className="min-h-screen">
        <Navbar email={email} name={name} />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Voting</h1>
            <div className="gold-divider mt-4" />
          </div>
          <div className="card text-center py-16">
            <p className="text-lg font-semibold text-white mb-2">Voting opens soon</p>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
              The voting phase has not started yet. Check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active voting events
  const { data: events } = await supabase
    .from("voting_events")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // User's votes
  const { data: myVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />
      <RealtimeRefresh />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Voting</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
            Cast your vote in active elections. You can vote once per event.
          </p>
          <div className="gold-divider mt-4" />
        </div>

        {(!events || events.length === 0) ? (
          <div className="card text-center py-14">
            <div className="text-4xl mb-3">🗳️</div>
            <p style={{ color: "rgba(245,240,232,0.5)" }}>No active votes right now.</p>
            <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.3)" }}>
              Check back when an event has been opened by the admins.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {(events as VotingEvent[]).map((event) => {
              const myVote = (myVotes as Vote[] | null)?.find(
                (v) => v.event_id === event.id
              );
              return (
                <VoteBallot
                  key={event.id}
                  event={event}
                  userId={user.id}
                  myVote={myVote ?? null}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
