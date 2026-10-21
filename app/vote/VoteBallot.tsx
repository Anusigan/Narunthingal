"use client";

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
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white mb-1">{event.title}</h2>
      {event.description && (
        <p className="text-gray-400 text-sm mb-4">{event.description}</p>
      )}

      {voted ? (
        <div className="flex flex-col gap-3 mt-4">
          <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-3">
            <p className="text-emerald-400 font-medium text-sm">
              ✓ You voted for{" "}
              <span className="text-white font-semibold">{voted}</span>
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Your vote has been recorded.
            </p>
          </div>

          {/* Show candidate list (no counts) */}
          <div className="flex flex-col gap-2 mt-1">
            {event.candidates.map((c) => (
              <div
                key={c}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
                  c === voted
                    ? "bg-purple-900/40 border border-purple-700 text-purple-300"
                    : "bg-gray-800/50 text-gray-400"
                }`}
              >
                {c === voted && <span className="text-purple-400">✓</span>}
                {c}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Select a candidate
          </p>

          {event.candidates.map((candidate) => (
            <label
              key={candidate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                selected === candidate
                  ? "border-purple-500 bg-purple-900/30 text-white"
                  : "border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
              }`}
            >
              <input
                type="radio"
                name={`vote-${event.id}`}
                value={candidate}
                checked={selected === candidate}
                onChange={() => setSelected(candidate)}
                className="accent-purple-500 w-4 h-4"
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

          <p className="text-xs text-gray-600 text-center">
            Your vote is anonymous. You cannot change it after submission.
          </p>
        </div>
      )}
    </div>
  );
}
