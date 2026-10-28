import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminAsync } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Unauthorized from "@/components/Unauthorized";
import { POSITIONS } from "@/lib/types";
import type { Application, VotingEvent, Vote } from "@/lib/types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(212,160,23,0.6)" }}>
        {label}
      </p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, total, color = "#D4A017" }: { label: string; count: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: "rgba(245,240,232,0.75)" }}>{label}</span>
        <span className="font-medium tabular-nums" style={{ color }}>
          {count} <span style={{ color: "rgba(245,240,232,0.35)", fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdminAsync(user.email!, supabase))) return <Unauthorized />;

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  // Fetch all data in parallel
  const [{ data: apps }, { data: events }, { data: votes }] = await Promise.all([
    supabase.from("applications").select("first_preference, second_preference, volunteered_last_year, submitted_at"),
    supabase.from("voting_events").select("id, title, total_eligible, is_active, created_at"),
    supabase.from("votes").select("event_id, voted_at"),
  ]);

  const applications = (apps ?? []) as Pick<Application, "first_preference" | "second_preference" | "volunteered_last_year" | "submitted_at">[];
  const votingEvents = (events ?? []) as Pick<VotingEvent, "id" | "title" | "total_eligible" | "is_active" | "created_at">[];
  const allVotes = (votes ?? []) as Pick<Vote, "event_id" | "voted_at">[];

  // ── Application stats ──────────────────────────────────────────
  const totalApps = applications.length;
  const returnees = applications.filter((a) => a.volunteered_last_year).length;
  const returnPct = totalApps > 0 ? Math.round((returnees / totalApps) * 100) : 0;
  const withSecond = applications.filter((a) => a.second_preference).length;

  // Role breakdown — first preference
  const firstPrefCounts = POSITIONS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = applications.filter((a) => a.first_preference === p).length;
    return acc;
  }, {});

  // Role breakdown — second preference
  const secondPrefCounts = POSITIONS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = applications.filter((a) => a.second_preference === p).length;
    return acc;
  }, {});

  // Submissions by day (last 14 days)
  const today = new Date();
  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = applications.filter((a) => a.submitted_at.slice(0, 10) === key).length;
    days.push({ label, count });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  // ── Voting stats ───────────────────────────────────────────────
  const totalVotes = allVotes.length;
  const activeEvents = votingEvents.filter((e) => e.is_active).length;

  const eventStats = votingEvents.map((e) => {
    const cast = allVotes.filter((v) => v.event_id === e.id).length;
    const eligible = e.total_eligible ?? 0;
    const turnout = eligible > 0 ? Math.round((cast / eligible) * 100) : null;
    return { ...e, cast, eligible, turnout };
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)" }}>
      <Navbar email={email} name={name} isAdmin={true} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
            Portal activity and application insights
          </p>
          <div className="gold-divider mt-3" />
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Applications" value={totalApps} />
          <StatCard label="Total Votes" value={totalVotes} />
          <StatCard label="Active Events" value={activeEvents} sub={`${votingEvents.length} total`} />
          <StatCard label="Return Rate" value={`${returnPct}%`} sub={`${returnees} volunteered last year`} />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {/* First preference breakdown */}
          <div className="card flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">1st Preference by Role</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                Which roles applicants want most
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {POSITIONS.slice()
                .sort((a, b) => (firstPrefCounts[b] ?? 0) - (firstPrefCounts[a] ?? 0))
                .map((pos) => (
                  <BarRow key={pos} label={pos} count={firstPrefCounts[pos] ?? 0} total={totalApps} />
                ))}
            </div>
          </div>

          {/* Second preference breakdown */}
          <div className="card flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">2nd Preference by Role</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                {withSecond} of {totalApps} applicants chose a backup role
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {POSITIONS.slice()
                .sort((a, b) => (secondPrefCounts[b] ?? 0) - (secondPrefCounts[a] ?? 0))
                .map((pos) => (
                  <BarRow
                    key={pos}
                    label={pos}
                    count={secondPrefCounts[pos] ?? 0}
                    total={withSecond || 1}
                    color="rgba(212,160,23,0.65)"
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Submission timeline */}
        <div className="card mb-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Submission Activity</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
              Applications submitted per day (last 14 days)
            </p>
          </div>
          <div className="flex items-end gap-1 h-20">
            {days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max((d.count / maxDay) * 64, d.count > 0 ? 4 : 0)}px`,
                    background: d.count > 0 ? "#D4A017" : "rgba(255,255,255,0.06)",
                    transition: "background 150ms",
                  }}
                />
                {d.count > 0 && (
                  <span
                    className="absolute -top-5 text-xs font-medium"
                    style={{ color: "#D4A017" }}
                  >
                    {d.count}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>{days[0]?.label}</span>
            <span className="text-xs" style={{ color: "rgba(245,240,232,0.3)" }}>{days[days.length - 1]?.label}</span>
          </div>
        </div>

        {/* Voting events table */}
        {eventStats.length > 0 && (
          <div className="card">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">Voting Events</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                Turnout per event
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {eventStats.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ background: e.is_active ? "#4ade80" : "rgba(255,255,255,0.2)" }}
                    />
                    <span className="text-sm font-medium text-white truncate">{e.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <span style={{ color: "rgba(245,240,232,0.45)" }}>
                      {e.cast} / {e.eligible > 0 ? e.eligible : "?"} votes
                    </span>
                    {e.turnout !== null ? (
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: e.turnout >= 70 ? "#4ade80" : e.turnout >= 40 ? "#D4A017" : "#f87171" }}
                      >
                        {e.turnout}%
                      </span>
                    ) : (
                      <span style={{ color: "rgba(245,240,232,0.3)" }}>N/A</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
