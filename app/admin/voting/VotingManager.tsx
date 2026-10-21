"use client";

import { notifyVotingChanged } from "@/lib/votingRealtime";
import { createClient } from "@/lib/supabase/client";
import type { Vote, VotingEvent } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  events: VotingEvent[];
  votes: Vote[];
}

interface ElectedEntry { role: string; person: string }

export default function VotingManager({ userId, events, votes }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create-event form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCandidates, setNewCandidates] = useState("");
  const [newDuration, setNewDuration] = useState("");      // minutes, optional
  const [newEligible, setNewEligible] = useState("");      // total eligible voters, optional

  // Release-results modal state
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [electedEntries, setElectedEntries] = useState<ElectedEntry[]>([
    { role: "President", person: "" },
    { role: "Secretary", person: "" },
  ]);

  async function createEvent() {
    if (!newTitle.trim()) return setError("Title is required.");
    const candidates = newCandidates.split("\n").map((c) => c.trim()).filter(Boolean);
    if (candidates.length < 2) return setError("Add at least 2 candidates (one per line).");

    setBusy("create");
    setError(null);
    const supabase = createClient();
    const { error: dbErr } = await supabase.from("voting_events").insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      candidates,
      is_active: false,
      created_by: userId,
      duration_minutes: newDuration ? parseInt(newDuration, 10) : null,
      total_eligible: newEligible ? parseInt(newEligible, 10) : null,
    });
    setBusy(null);
    if (dbErr) return setError(dbErr.message);
    setCreating(false);
    setNewTitle(""); setNewDesc(""); setNewCandidates("");
    setNewDuration(""); setNewEligible("");
    router.refresh();
  }

  async function toggleActive(event: VotingEvent) {
    setBusy(event.id);
    const supabase = createClient();
    const update: Record<string, unknown> = { is_active: !event.is_active };
    if (!event.is_active && event.duration_minutes) {
      // Setting active — compute ends_at from duration
      update.ends_at = new Date(Date.now() + event.duration_minutes * 60 * 1000).toISOString();
    } else if (event.is_active) {
      update.ends_at = null;
    }
    await supabase.from("voting_events").update(update).eq("id", event.id);
    await notifyVotingChanged(supabase);
    setBusy(null);
    router.refresh();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this voting event and all its votes?")) return;
    setBusy(id + "-del");
    const supabase = createClient();
    await supabase.from("voting_events").delete().eq("id", id);
    setBusy(null);
    router.refresh();
  }

  async function releaseResults() {
    if (!releasingId) return;
    const validEntries = electedEntries.filter((e) => e.role.trim() && e.person.trim());
    if (validEntries.length === 0) return setError("Add at least one elected position.");

    setBusy("release-" + releasingId);
    setError(null);
    const elected = Object.fromEntries(validEntries.map((e) => [e.role.trim(), e.person.trim()]));
    const supabase = createClient();
    const { error: dbErr } = await supabase
      .from("voting_events")
      .update({ results_released: true, elected })
      .eq("id", releasingId);
    if (!dbErr) await notifyVotingChanged(supabase);
    setBusy(null);
    if (dbErr) return setError(dbErr.message);
    setReleasingId(null);
    router.refresh();
  }

  function openReleaseModal(event: VotingEvent) {
    // Pre-fill with existing elected data if any
    if (event.elected && Object.keys(event.elected).length > 0) {
      setElectedEntries(Object.entries(event.elected).map(([role, person]) => ({ role, person })));
    } else {
      setElectedEntries([{ role: "President", person: "" }, { role: "Secretary", person: "" }]);
    }
    setError(null);
    setReleasingId(event.id);
  }

  function resultsFor(event: VotingEvent) {
    const eventVotes = votes.filter((v) => v.event_id === event.id);
    const total = eventVotes.length;
    const counts: Record<string, number> = {};
    event.candidates.forEach((c) => (counts[c] = 0));
    eventVotes.forEach((v) => { counts[v.candidate] = (counts[v.candidate] ?? 0) + 1; });
    return { total, counts };
  }

  const releasingEvent = events.find((e) => e.id === releasingId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Release Results modal */}
      {releasingId && releasingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,7,6,0.85)" }}
        >
          <div className="card w-full max-w-lg" style={{ borderColor: "rgba(212,160,23,0.4)" }}>
            <h2 className="text-lg font-semibold text-white mb-1">Release Results</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(245,240,232,0.45)" }}>
              {releasingEvent.title} — enter the elected members below.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              {electedEntries.map((entry, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Role (e.g. President)"
                    value={entry.role}
                    onChange={(e) => {
                      const updated = [...electedEntries];
                      updated[i] = { ...updated[i], role: e.target.value };
                      setElectedEntries(updated);
                    }}
                  />
                  <input
                    className="input flex-1"
                    placeholder="Elected person"
                    value={entry.person}
                    onChange={(e) => {
                      const updated = [...electedEntries];
                      updated[i] = { ...updated[i], person: e.target.value };
                      setElectedEntries(updated);
                    }}
                  />
                  <button
                    onClick={() => setElectedEntries(electedEntries.filter((_, j) => j !== i))}
                    className="px-2 py-1 text-sm rounded"
                    style={{ color: "rgba(245,240,232,0.35)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setElectedEntries([...electedEntries, { role: "", person: "" }])}
                className="text-sm self-start"
                style={{ color: "rgba(212,160,23,0.6)" }}
              >
                + Add position
              </button>
            </div>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={releaseResults}
                disabled={busy === "release-" + releasingId}
                className="btn-primary"
              >
                {busy === "release-" + releasingId ? "Releasing..." : "Release Results"}
              </button>
              <button
                onClick={() => { setReleasingId(null); setError(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setCreating(true); setError(null); }}
          className="btn-primary"
        >
          + New Voting Event
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card" style={{ borderColor: "rgba(212,160,23,0.4)" }}>
          <h2 className="font-semibold text-white mb-5 text-lg">New Voting Event</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Title <span style={{ color: "#D4A017" }}>*</span></label>
              <input className="input" placeholder="e.g. President Election"
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="Short description..."
                value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div>
              <label className="label">Candidates <span style={{ color: "#D4A017" }}>*</span></label>
              <p className="text-xs mb-1.5" style={{ color: "rgba(212,160,23,0.5)" }}>
                One candidate name per line. At least 2 required.
              </p>
              <textarea
                className="input min-h-[120px] resize-y font-mono"
                placeholder={"Candidate A\nCandidate B\nCandidate C"}
                value={newCandidates}
                onChange={(e) => setNewCandidates(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="label">Voting Duration (minutes, optional)</label>
                <input className="input" type="number" min="1" placeholder="e.g. 30"
                  value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
                <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.3)" }}>
                  Countdown starts when event is activated.
                </p>
              </div>
              <div className="flex-1">
                <label className="label">Total Eligible Voters (optional)</label>
                <input className="input" type="number" min="1" placeholder="e.g. 150"
                  value={newEligible} onChange={(e) => setNewEligible(e.target.value)} />
                <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.3)" }}>
                  Shows participation progress to voters.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button onClick={createEvent} disabled={busy === "create"} className="btn-primary">
                {busy === "create" ? "Creating..." : "Create Event"}
              </button>
              <button onClick={() => { setCreating(false); setError(null); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      {events.length === 0 && !creating && (
        <div className="card text-center py-12" style={{ color: "rgba(245,240,232,0.4)" }}>
          No voting events yet. Create one above.
        </div>
      )}

      {events.map((event) => {
        const { total, counts } = resultsFor(event);
        const maxVotes = Math.max(...Object.values(counts), 1);
        const endsAt = event.ends_at ? new Date(event.ends_at) : null;
        const isExpired = endsAt ? endsAt < new Date() : false;

        return (
          <div
            key={event.id}
            className="card"
            style={event.is_active
              ? { borderColor: "rgba(212,160,23,0.5)", boxShadow: "0 4px 32px rgba(212,160,23,0.12)" }
              : {}}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                  {event.is_active ? (
                    <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                      🟢 Active
                    </span>
                  ) : (
                    <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.4)" }}>
                      Inactive
                    </span>
                  )}
                  {event.results_released && (
                    <span className="badge" style={{ background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.3)" }}>
                      Results Released
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.5)" }}>
                    {event.description}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.3)" }}>
                  Created {new Date(event.created_at).toLocaleDateString("en-GB")} •{" "}
                  {total} vote{total !== 1 ? "s" : ""} cast
                  {event.total_eligible ? ` / ${event.total_eligible} eligible` : ""}
                  {event.duration_minutes ? ` • ${event.duration_minutes}m window` : ""}
                </p>
                {endsAt && event.is_active && !isExpired && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(212,160,23,0.6)" }}>
                    ⏱ Closes at {endsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {isExpired && event.is_active && (
                  <p className="text-xs mt-0.5" style={{ color: "#f87171" }}>
                    Duration expired — deactivate to close voting.
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap sm:flex-shrink-0 sm:justify-end">
                <button
                  onClick={() => openReleaseModal(event)}
                  className="btn-secondary text-sm"
                  style={{ borderColor: "rgba(212,160,23,0.4)", color: "rgba(212,160,23,0.8)" }}
                >
                  {event.results_released ? "Update Results" : "Release Results"}
                </button>
                <button
                  onClick={() => toggleActive(event)}
                  disabled={busy === event.id}
                  className={event.is_active ? "btn-danger" : "btn-success"}
                >
                  {busy === event.id ? "..." : event.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  disabled={busy === event.id + "-del"}
                  className="px-3 py-2 rounded-lg text-sm delete-icon-btn"
                  title="Delete event"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Admin results (vote counts) */}
            <div className="flex flex-col gap-3 mb-4">
              <h3 className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.6)" }}>
                Votes
              </h3>
              {event.candidates.map((candidate) => {
                const count = counts[candidate] ?? 0;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                return (
                  <div key={candidate}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "rgba(245,240,232,0.85)" }}>{candidate}</span>
                      <span style={{ color: "rgba(245,240,232,0.5)" }}>
                        {count} vote{count !== 1 ? "s" : ""}{" "}
                        <span style={{ color: "rgba(245,240,232,0.3)" }}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${total === 0 ? 0 : (count / maxVotes) * 100}%`,
                          background: count === maxVotes && count > 0
                            ? "linear-gradient(90deg, #C8900A, #FFD060)"
                            : "rgba(212,160,23,0.4)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Elected results if released */}
            {event.results_released && event.elected && Object.keys(event.elected).length > 0 && (
              <div className="border-t pt-4" style={{ borderColor: "rgba(212,160,23,0.15)" }}>
                <h3 className="text-xs uppercase tracking-wide mb-3" style={{ color: "rgba(212,160,23,0.6)" }}>
                  Elected Members (Public)
                </h3>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(event.elected).map(([role, person]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span style={{ color: "rgba(245,240,232,0.5)" }}>{role}</span>
                      <span className="font-medium text-white">{person}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
