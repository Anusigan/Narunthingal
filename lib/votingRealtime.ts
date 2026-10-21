import type { SupabaseClient } from "@supabase/supabase-js";

const TOPIC = "voting-updates";

// Tell every open page that votes or events changed. Broadcast needs no
// database setup, so it works even if table replication isn't enabled.
export async function notifyVotingChanged(supabase: SupabaseClient) {
  const ch = supabase.channel(TOPIC);
  await new Promise<void>((resolve) => {
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({ type: "broadcast", event: "changed", payload: {} }).finally(resolve);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        resolve();
      }
    });
  });
  supabase.removeChannel(ch);
}

// Fires cb on a broadcast, or on any row change if replication is enabled.
export function subscribeVotingChanges(supabase: SupabaseClient, cb: () => void) {
  const ch = supabase
    .channel(`${TOPIC}-listen-${Math.random().toString(36).slice(2)}`)
    .on("broadcast", { event: "changed" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "voting_events" }, cb)
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
