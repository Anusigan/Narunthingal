"use client";

import { createClient } from "@/lib/supabase/client";
import { subscribeVotingChanges } from "@/lib/votingRealtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetches the server-rendered page the moment voting data changes.
export default function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = subscribeVotingChanges(createClient(), () => router.refresh());
    return unsubscribe;
  }, [router]);
  return null;
}
