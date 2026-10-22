import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LiveBoard from "./LiveBoard";
import { isAdminAsync } from "@/lib/admin";
import type { VotingEvent } from "@/lib/types";

export default async function LiveVotePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
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
            <h1 className="text-3xl font-bold text-white">Live Results</h1>
            <div className="gold-divider mt-4" />
          </div>
          <div className="card text-center py-16">
            <p className="text-lg font-semibold text-white mb-2">Results not available yet</p>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
              Live results will appear here once voting begins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Requested event, otherwise the newest active one, otherwise the newest
  let query = supabase.from("voting_events").select("*");
  if (eventId) {
    query = query.eq("id", eventId);
  } else {
    query = query
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });
  }
  const { data: events } = await query.limit(1);
  const event = (events?.[0] as VotingEvent | undefined) ?? null;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />
      <LiveBoard initialEvent={event} />
    </div>
  );
}
