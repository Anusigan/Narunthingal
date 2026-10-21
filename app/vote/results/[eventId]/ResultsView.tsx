"use client";

import type { VotingEvent, Vote } from "@/lib/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  event: VotingEvent;
  myVote: Vote;
  totalVotes: number;
  voterName: string;
}

export default function ResultsView({ event, myVote, totalVotes, voterName }: Props) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  // Live countdown if voting has an end time
  useEffect(() => {
    if (!event.ends_at) return;
    const tick = () => {
      const diff = new Date(event.ends_at!).getTime() - Date.now();
      if (diff <= 0) {
        setClosed(true);
        setTimeLeft(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [event.ends_at]);

  // Poll every 20 s until results are released
  useEffect(() => {
    if (event.results_released) return;
    const id = setTimeout(() => router.refresh(), 20000);
    return () => clearTimeout(id);
  }, [event.results_released, router]);

  const eligible = event.total_eligible ?? null;
  const remaining = eligible !== null ? eligible - totalVotes : null;
  const pct = eligible ? Math.min(100, Math.round((totalVotes / eligible) * 100)) : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-2xl"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Vote Recorded</h1>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
          Thank you, {voterName}.
        </p>
      </div>

      {/* Your vote */}
      <div
        className="card mb-4"
        style={{ borderColor: "rgba(212,160,23,0.3)" }}
      >
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(212,160,23,0.6)" }}>
          {event.title}
        </p>
        <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.55)" }}>
          You voted for{" "}
          <span className="font-semibold" style={{ color: "#D4A017" }}>
            {myVote.candidate}
          </span>
        </p>

        {/* Voting window status */}
        {event.ends_at && (
          <div
            className="mt-3 text-xs px-3 py-1.5 rounded-md inline-block"
            style={
              closed || !event.is_active
                ? { background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.35)" }
                : { background: "rgba(212,160,23,0.1)", color: "rgba(212,160,23,0.8)" }
            }
          >
            {closed || !event.is_active
              ? "Voting closed"
              : timeLeft
              ? `⏱ ${timeLeft} left`
              : ""}
          </div>
        )}
      </div>

      {/* Participation */}
      <div className="card mb-4">
        <h3
          className="text-xs uppercase tracking-wide mb-3"
          style={{ color: "rgba(212,160,23,0.6)" }}
        >
          Participation
        </h3>

        <div className="flex items-end gap-2 mb-1">
          <span className="text-3xl font-bold text-white">{totalVotes}</span>
          {eligible !== null && (
            <span className="text-base mb-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>
              / {eligible}
            </span>
          )}
        </div>

        <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
          {eligible !== null
            ? remaining! > 0
              ? `votes cast · ${remaining} member${remaining !== 1 ? "s" : ""} still to vote`
              : "All members have voted"
            : "votes cast so far"}
        </p>

        {pct !== null && (
          <div
            className="mt-3 w-full rounded-full h-2 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #C8900A, #FFD060)",
              }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card">
        {event.results_released && event.elected && Object.keys(event.elected).length > 0 ? (
          <>
            <h3
              className="text-xs uppercase tracking-wide mb-4"
              style={{ color: "rgba(212,160,23,0.6)" }}
            >
              Elected Members
            </h3>
            <div className="flex flex-col gap-2">
              {Object.entries(event.elected).map(([role, person]) => (
                <div
                  key={role}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{
                    background: "rgba(212,160,23,0.07)",
                    border: "1px solid rgba(212,160,23,0.2)",
                  }}
                >
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "rgba(212,160,23,0.65)" }}
                  >
                    {role}
                  </span>
                  <span className="font-semibold text-white">{person}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-2xl mb-3">🔒</div>
            <p className="font-medium text-white mb-1">Results Pending</p>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
              The organizing committee will announce the elected members.
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(245,240,232,0.25)" }}>
              This page refreshes automatically.
            </p>
          </div>
        )}
      </div>

      <Link
        href="/"
        className="block text-center mt-6 text-sm transition-colors"
        style={{ color: "rgba(212,160,23,0.45)" }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
