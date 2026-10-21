"use client";

import { createClient } from "@/lib/supabase/client";
import { onPresence, type OnlineUser } from "@/lib/presence";
import { subscribeVotingChanges } from "@/lib/votingRealtime";
import type { VotingEvent } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

const POLL_MS = 10000; // fallback; realtime pushes updates instantly
const COUNTDOWN_FROM = 5;
const REVEAL_MS = 3000;

type Stage = "waiting" | "countdown" | "reveal" | "done";

export default function LiveBoard({ initialEvent }: { initialEvent: VotingEvent | null }) {
  const [event, setEvent] = useState(initialEvent);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);

  const [stage, setStage] = useState<Stage>("waiting");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [revealIdx, setRevealIdx] = useState(0);
  const started = useRef(false);

  useEffect(() => onPresence(setOnline), []);

  const released = !!(
    event?.results_released && event.elected && Object.keys(event.elected).length > 0
  );
  const electedList = useMemo(() => Object.entries(event?.elected ?? {}), [event?.elected]);

  // Results released: 5…1 countdown, then reveal each elected name in turn
  useEffect(() => {
    if (!released || started.current) return;
    started.current = true;
    setCount(COUNTDOWN_FROM);
    setStage("countdown");
  }, [released]);

  useEffect(() => {
    if (stage !== "countdown") return;
    if (count <= 0) {
      setRevealIdx(0);
      setStage("reveal");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, count]);

  useEffect(() => {
    if (stage !== "reveal") return;
    if (revealIdx >= electedList.length) {
      setStage("done");
      return;
    }
    const t = setTimeout(() => setRevealIdx((i) => i + 1), REVEAL_MS);
    return () => clearTimeout(t);
  }, [stage, revealIdx, electedList.length]);

  // Poll votes and the event row (so the screen flips when results are released)
  useEffect(() => {
    if (!initialEvent) return;
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [{ data: votes }, { data: ev }] = await Promise.all([
        supabase.from("votes").select("user_id").eq("event_id", initialEvent!.id),
        supabase.from("voting_events").select("*").eq("id", initialEvent!.id).single(),
      ]);
      if (cancelled) return;
      if (votes) setVotedIds(votes.map((v) => v.user_id));
      if (ev) setEvent(ev as VotingEvent);
    }

    load();
    const id = setInterval(load, POLL_MS);
    const unsubscribe = subscribeVotingChanges(supabase, load);
    return () => {
      cancelled = true;
      clearInterval(id);
      unsubscribe();
    };
  }, [initialEvent]);

  // Admins watch the screen but don't vote, so they aren't counted as voters
  const voters = useMemo(() => online.filter((u) => !u.admin), [online]);
  const voted = useMemo(() => new Set(votedIds), [votedIds]);
  const votedOnline = voters.filter((u) => voted.has(u.user_id)).length;
  const waitingOn = voters.filter((u) => !voted.has(u.user_id));
  const everyoneVoted = voters.length > 0 && waitingOn.length === 0;
  const pct = voters.length ? Math.round((votedOnline / voters.length) * 100) : 0;

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card text-center py-14" style={{ color: "rgba(245,240,232,0.5)" }}>
          No voting event found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.6)" }}>
          Live voting
        </p>
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <div className="gold-divider mt-4" />
      </div>

      {released && stage === "done" ? (
        <div className="card">
          <h3 className="text-xs uppercase tracking-wide mb-4" style={{ color: "rgba(212,160,23,0.6)" }}>
            Elected Members
          </h3>
          <div className="flex flex-col gap-2">
            {Object.entries(event.elected!).map(([role, person]) => (
              <div
                key={role}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.2)" }}
              >
                <span className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.65)" }}>
                  {role}
                </span>
                <span className="font-semibold text-white">{person}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Signed in" value={voters.length} />
            <Stat label="Voted" value={votedOnline} accent />
            <Stat label="Yet to vote" value={waitingOn.length} />
          </div>

          <div className="card mb-4">
            <div className="flex justify-between text-sm mb-2" style={{ color: "rgba(245,240,232,0.55)" }}>
              <span>
                {votedOnline} of {voters.length} signed-in voter{voters.length !== 1 ? "s" : ""} have voted
              </span>
              <span>{pct}%</span>
            </div>
            <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C8900A, #FFD060)" }}
              />
            </div>
            {!everyoneVoted && waitingOn.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1 text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>
                {waitingOn.map((u) => (
                  <li key={u.user_id}>Waiting for {u.email.split("@")[0]}…</li>
                ))}
              </ul>
            )}
          </div>

          {!event.is_active && (
            <p className="text-center text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
              Voting is not currently active.
            </p>
          )}
        </>
      )}

      {(stage === "countdown" || stage === "reveal") && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(5,4,3,0.95)", backdropFilter: "blur(8px)" }}
        >
          {stage === "countdown" ? (
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{ color: "rgba(212,160,23,0.6)" }}>
                Results in
              </p>
              <div
                key={count}
                className="font-bold"
                style={{
                  fontSize: "clamp(6rem, 25vw, 12rem)",
                  lineHeight: 1,
                  color: "#E8B820",
                  textShadow: "0 0 40px rgba(232,184,32,0.6)",
                  animation: "countPop 1s ease-out",
                }}
              >
                {count}
              </div>
            </div>
          ) : (
            electedList[revealIdx] && (
              <div key={revealIdx} className="text-center" style={{ animation: "countPop 0.8s ease-out" }}>
                <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "rgba(212,160,23,0.65)" }}>
                  {electedList[revealIdx][0]}
                </p>
                <p
                  className="font-bold"
                  style={{
                    fontSize: "clamp(2rem, 9vw, 4.5rem)",
                    color: "#E8B820",
                    textShadow: "0 0 40px rgba(232,184,32,0.5)",
                  }}
                >
                  {electedList[revealIdx][1]}
                </p>
              </div>
            )
          )}
          <style>{`@keyframes countPop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}

      {/* Everyone has voted: waiting-for-results pop-up */}
      {everyoneVoted && !released && stage === "waiting" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(5,4,3,0.88)", backdropFilter: "blur(6px)" }}
        >
          <div className="card text-center max-w-sm w-full" style={{ borderColor: "rgba(212,160,23,0.4)" }}>
            <div
              className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(212,160,23,0.3)", borderTopColor: "#D4A017" }}
            />
            <p className="text-lg font-semibold text-white mb-1">Waiting for the results</p>
            <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
              All {voters.length} voter{voters.length !== 1 ? "s" : ""} have cast their votes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card text-center">
      <div className="text-3xl font-bold" style={{ color: accent ? "#D4A017" : "#f5f0e8" }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide mt-1" style={{ color: "rgba(245,240,232,0.4)" }}>
        {label}
      </div>
    </div>
  );
}
