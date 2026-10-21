"use client";

import { notifyVotingChanged } from "@/lib/votingRealtime";
import { createClient } from "@/lib/supabase/client";
import type { Vote, VotingEvent } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  event: VotingEvent;
  userId: string;
  myVote: Vote | null;
}

export default function VoteBallot({ event, userId, myVote }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(myVote?.candidate ?? null);

  async function submitVote() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: dbErr } = await supabase.from("votes").insert({
      event_id: event.id,
      user_id: userId,
      candidate: selected,
    });

    if (!dbErr) await notifyVotingChanged(supabase);
    setSubmitting(false);
    if (dbErr) {
      if (dbErr.code === "23505") {
        setError("You have already voted in this event.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setVoted(selected);
    router.push(`/vote/live?event=${event.id}`);
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-1">{event.title}</h2>
      {event.description && (
        <p className="text-sm mb-4" style={{ color: "rgba(245,240,232,0.5)" }}>{event.description}</p>
      )}

      {voted ? (
        <div className="flex flex-col gap-4 mt-4">
          <div className="rounded-lg px-5 py-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.28)" }}>
            <p className="font-semibold text-sm" style={{ color: "#34d399" }}>
              ✓ Vote recorded
            </p>
            <p className="text-sm mt-1 text-white">
              You voted for <span style={{ color: "#D4A017" }}>{voted}</span>
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.35)" }}>
              Results will be announced by the organizing committee.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.6)" }}>
            Select a candidate
          </p>

          {event.candidates.map((candidate) => (
            <label
              key={candidate}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all"
              style={selected === candidate
                ? { borderColor: "rgba(212,160,23,0.6)", background: "rgba(212,160,23,0.12)", color: "#f5f0e8" }
                : { borderColor: "rgba(212,160,23,0.15)", background: "rgba(255,255,255,0.03)", color: "rgba(245,240,232,0.7)" }}
            >
              <input
                type="radio"
                name={`vote-${event.id}`}
                value={candidate}
                checked={selected === candidate}
                onChange={() => setSelected(candidate)}
                className="w-4 h-4"
                style={{ accentColor: "#D4A017" } as React.CSSProperties}
              />
              <span className="font-medium">{candidate}</span>
            </label>
          ))}

          {error && (
            <p className="text-sm text-red-400 mt-1">{error}</p>
          )}

          <button
            onClick={submitVote}
            disabled={!selected || submitting}
            className="btn-primary mt-2"
          >
            {submitting ? "Submitting..." : "Cast Vote"}
          </button>

          <p className="text-xs text-center" style={{ color: "rgba(212,160,23,0.4)" }}>
            Your vote is anonymous. You cannot change it after submission.
          </p>
        </div>
      )}
    </div>
  );
}
