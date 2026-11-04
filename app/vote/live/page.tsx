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
      <Navbar email={email} name={name} isAdmin={admin} />
      <LiveBoard initialEvent={event} />
    </div>
  );
}
