"use client";

import { createClient } from "@/lib/supabase/client";
import type { Vote, VotingEvent } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  events: VotingEvent[];
  votes: Vote[];
}

export default function VotingManager({ userId, events, votes }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create-event form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCandidates, setNewCandidates] = useState(""); // one per line

  async function createEvent() {
    if (!newTitle.trim()) return setError("Title is required.");
    const candidates = newCandidates
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (candidates.length < 2)
      return setError("Add at least 2 candidates (one per line).");

    setBusy("create");
    setError(null);
    const supabase = createClient();
    const { error: dbErr } = await supabase.from("voting_events").insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      candidates,
      is_active: false,
      created_by: userId,
    });
    setBusy(null);
    if (dbErr) return setError(dbErr.message);
    setCreating(false);
    setNewTitle("");
    setNewDesc("");
    setNewCandidates("");
    router.refresh();
  }

  async function toggleActive(id: string, current: boolean) {
    setBusy(id);
    const supabase = createClient();
    await supabase
      .from("voting_events")
      .update({ is_active: !current })
      .eq("id", id);
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

  function resultsFor(event: VotingEvent) {
    const eventVotes = votes.filter((v) => v.event_id === event.id);
    const total = eventVotes.length;
    const counts: Record<string, number> = {};
    event.candidates.forEach((c) => (counts[c] = 0));
    eventVotes.forEach((v) => {
      counts[v.candidate] = (counts[v.candidate] ?? 0) + 1;
    });
    return { total, counts };
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setCreating(true);
            setError(null);
          }}
          className="btn-primary"
        >
          + New Voting Event
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card border-purple-900">
          <h2 className="font-semibold text-white mb-5 text-lg">
            New Voting Event
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">
                Title <span className="text-purple-400">*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. President Election"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                className="input"
                placeholder="Short description..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                Candidates <span className="text-purple-400">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">
                One candidate name per line. At least 2 required.
              </p>
              <textarea
                className="input min-h-[120px] resize-y font-mono"
                placeholder={"Candidate A\nCandidate B\nCandidate C"}
                value={newCandidates}
                onChange={(e) => setNewCandidates(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={createEvent}
                disabled={busy === "create"}
                className="btn-primary"
              >
                {busy === "create" ? "Creating..." : "Create Event"}
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      {events.length === 0 && !creating && (
        <div className="card text-center text-gray-500 py-12">
          No voting events yet. Create one above.
        </div>
      )}

      {events.map((event) => {
        const { total, counts } = resultsFor(event);
        const maxVotes = Math.max(...Object.values(counts), 1);

        return (
          <div
            key={event.id}
            className={`card border ${
              event.is_active
                ? "border-purple-700 shadow-lg shadow-purple-950/50"
                : "border-gray-800"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-white">
                    {event.title}
                  </h2>
                  {event.is_active ? (
                    <span className="badge bg-emerald-900/60 text-emerald-400 border border-emerald-800">
                      🟢 Active
                    </span>
                  ) : (
                    <span className="badge bg-gray-800 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-gray-400 text-sm mt-1">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Created{" "}
                  {new Date(event.created_at).toLocaleDateString("en-GB")} •{" "}
                  {total} vote{total !== 1 ? "s" : ""} cast
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(event.id, event.is_active)}
                  disabled={busy === event.id}
                  className={
                    event.is_active ? "btn-danger" : "btn-success"
                  }
                >
                  {busy === event.id
                    ? "..."
                    : event.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  disabled={busy === event.id + "-del"}
                  className="px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors text-sm"
                  title="Delete event"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide">
                Results
              </h3>
              {event.candidates.map((candidate) => {
                const count = counts[candidate] ?? 0;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                return (
                  <div key={candidate}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{candidate}</span>
                      <span className="text-gray-400">
                        {count} vote{count !== 1 ? "s" : ""}{" "}
                        <span className="text-gray-600">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          count === maxVotes && count > 0
                            ? "bg-amber-400"
                            : "bg-purple-700"
                        }`}
                        style={{
                          width: `${total === 0 ? 0 : (count / maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
