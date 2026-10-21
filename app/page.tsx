import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { isAdminAsync } from "@/lib/admin";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;
  const admin = await isAdminAsync(email, supabase);

  const { data: application } = await supabase
    .from("applications")
    .select("id, first_preference, submitted_at")
    .eq("user_id", user.id)
    .single();

  const { count: voteCount } = await supabase
    .from("voting_events")
    .select("id", { count: "exact" })
    .eq("is_active", true);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <Image src="/narunthingal-bg.jpg" alt="" fill className="object-cover fixed" priority />
      <div className="fixed inset-0" style={{ background: "rgba(8,7,6,0.80)" }} />

      <div className="relative">
        <Navbar email={email} name={name} />

        {/* Hero */}
        <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-10 text-center">
          <Image
            src="/narunthingal-logo.jpg"
            alt="Narunthingal"
            width={120}
            height={120}
            className="rounded-2xl mx-auto mb-5"
            style={{ boxShadow: "0 0 48px rgba(212,160,23,0.45)" }}
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            Organizing{" "}
            <span style={{ color: "#D4A017" }}>Committee</span>
          </h1>
          <div className="gold-divider max-w-xs mx-auto my-4" />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
            Welcome, {name ?? email.split("@")[0]}
          </p>
        </div>

        {/* Cards */}
        <div className="max-w-4xl mx-auto px-4 pb-16 grid sm:grid-cols-2 gap-5">
          {/* Apply */}
          <div className="card flex flex-col gap-4">
            <div>
              <div className="text-2xl mb-2">📋</div>
              <h2 className="text-lg font-semibold text-white mb-1">Application</h2>
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                Apply to join the Narunthingal organizing committee and choose your preferred role.
              </p>
            </div>
            {application ? (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                <p className="font-medium" style={{ color: "#34d399" }}>✓ Application submitted</p>
                <p className="mt-1" style={{ color: "rgba(245,240,232,0.5)" }}>
                  First preference:{" "}
                  <span className="text-white font-medium">{application.first_preference}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>
                  Submitted {new Date(application.submitted_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <Link href="/apply" className="btn-primary text-center mt-auto block">
                Apply Now
              </Link>
            )}
          </div>

          {/* Vote */}
          <div className="card flex flex-col gap-4">
            <div>
              <div className="text-2xl mb-2">🗳️</div>
              <h2 className="text-lg font-semibold text-white mb-1">Voting</h2>
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                Participate in active committee votes. Your IIT login ensures one vote per person.
              </p>
            </div>
            {(voteCount ?? 0) > 0 ? (
              <div className="flex flex-col gap-3">
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)" }}
                >
                  <p className="font-medium" style={{ color: "#D4A017" }}>
                    🔔 {voteCount} active vote{voteCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href="/vote" className="btn-primary text-center block">
                  Go to Voting
                </Link>
              </div>
            ) : (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                No active votes right now. Check back later.
              </div>
            )}
          </div>

          {/* Admin — occupies full grid width, then splits into its own 3-col row */}
          {admin && (
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <div className="text-2xl mb-2">👥</div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin — Candidates</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    View, filter, sort, and search all submitted applications.
                  </p>
                </div>
                <Link href="/admin/candidates" className="btn-secondary text-center mt-auto block">
                  View Applications
                </Link>
              </div>

              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <div className="text-2xl mb-2">⚙️</div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin — Voting</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Create voting events, manage candidates, and see live results.
                  </p>
                </div>
                <Link href="/admin/voting" className="btn-secondary text-center mt-auto block">
                  Manage Voting
                </Link>
              </div>

              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <div className="text-2xl mb-2">🔑</div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin — Access</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Add or remove admin access for other IIT email addresses.
                  </p>
                </div>
                <Link href="/admin/admins" className="btn-secondary text-center mt-auto block">
                  Manage Admins
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
