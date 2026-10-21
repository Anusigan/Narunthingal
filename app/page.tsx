import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { isAdmin } from "@/lib/admin";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;
  const admin = isAdmin(email);

  // Check if user has already applied
  const { data: application } = await supabase
    .from("applications")
    .select("id, first_preference, submitted_at")
    .eq("user_id", user.id)
    .single();

  // Check active voting events
  const { data: activeVotes, count: voteCount } = await supabase
    .from("voting_events")
    .select("id", { count: "exact" })
    .eq("is_active", true);

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 to-gray-950 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            Narunthingal{" "}
            <span className="text-amber-400">Organizing Committee</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Apply for your desired position or participate in the committee
            voting. Every voice counts.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Welcome, {name ?? email.split("@")[0]}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-16 grid sm:grid-cols-2 gap-5">
        {/* Apply card */}
        <div className="card flex flex-col gap-4">
          <div>
            <div className="text-3xl mb-2">📋</div>
            <h2 className="text-xl font-semibold text-white">Application</h2>
            <p className="text-gray-400 text-sm mt-1">
              Apply to join the Narunthingal organizing committee. Choose your
              preferred role.
            </p>
          </div>

          {application ? (
            <div>
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-3 text-sm">
                <p className="text-emerald-400 font-medium">
                  ✓ Application submitted
                </p>
                <p className="text-gray-400 mt-1">
                  First preference:{" "}
                  <span className="text-white font-medium">
                    {application.first_preference}
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Submitted{" "}
                  {new Date(application.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <Link href="/apply" className="btn-primary text-center mt-auto">
              Apply Now
            </Link>
          )}
        </div>

        {/* Vote card */}
        <div className="card flex flex-col gap-4">
          <div>
            <div className="text-3xl mb-2">🗳️</div>
            <h2 className="text-xl font-semibold text-white">Voting</h2>
            <p className="text-gray-400 text-sm mt-1">
              Participate in active committee votes. Your IIT login ensures one
              vote per person.
            </p>
          </div>

          {(voteCount ?? 0) > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg px-4 py-3 text-sm">
                <p className="text-purple-300 font-medium">
                  🔔 {voteCount} active vote{voteCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Link href="/vote" className="btn-primary text-center">
                Go to Voting
              </Link>
            </div>
          ) : (
            <div>
              <div className="bg-gray-800/60 rounded-lg px-4 py-3 text-sm text-gray-400">
                No active votes right now. Check back later.
              </div>
            </div>
          )}
        </div>

        {/* Admin cards */}
        {admin && (
          <>
            <div className="card flex flex-col gap-4 border-purple-900">
              <div>
                <div className="text-3xl mb-2">👥</div>
                <h2 className="text-xl font-semibold text-white">
                  Admin — Candidates
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  View, filter, sort, and search all submitted applications.
                </p>
              </div>
              <Link
                href="/admin/candidates"
                className="btn-secondary text-center mt-auto"
              >
                View Applications
              </Link>
            </div>

            <div className="card flex flex-col gap-4 border-purple-900">
              <div>
                <div className="text-3xl mb-2">⚙️</div>
                <h2 className="text-xl font-semibold text-white">
                  Admin — Voting
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Create voting events, manage candidates, and see live results.
                </p>
              </div>
              <Link
                href="/admin/voting"
                className="btn-secondary text-center mt-auto"
              >
                Manage Voting
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
