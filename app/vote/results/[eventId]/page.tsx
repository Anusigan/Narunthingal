import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ResultsView from "./ResultsView";
import type { VotingEvent, Vote } from "@/lib/types";

export default async function VoteResultsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("voting_events")
    .select("*")
    .eq("id", params.eventId)
    .single();

  if (!event) redirect("/vote");

  // Only voters can see this page
  const { data: myVote } = await supabase
    .from("votes")
    .select("*")
    .eq("event_id", params.eventId)
    .eq("user_id", user.id)
    .single();

  if (!myVote) redirect("/vote");

  // Total votes cast for this event
  const { count: totalVotes } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", params.eventId);

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />
      <ResultsView
        event={event as VotingEvent}
        myVote={myVote as Vote}
        totalVotes={totalVotes ?? 0}
        voterName={name ?? email.split("@")[0]}
      />
    </div>
  );
}
