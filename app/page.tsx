import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { isAdminAsync, isSuperAdmin } from "@/lib/admin";
import DeadlineCountdown from "@/components/DeadlineCountdown";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();







  if (!user) redirect("/login");

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;
  const admin = await isAdminAsync(email, supabase);
  const superAdmin = isSuperAdmin(email);

  // Wednesday 28 Oct 2026 20:00 Sri Lanka time (UTC+5:30)
  const APPLICATION_DEADLINE = new Date("2026-10-28T14:30:00Z");
  const deadlinePassed = new Date() >= APPLICATION_DEADLINE;

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
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)",
      }}
    >
      <div className="flex flex-col min-h-screen">
        <Navbar email={email} name={name} isAdmin={admin} />

        {/* Hero */}
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-10 text-center flex flex-col items-center">
          <div className="relative mb-3 flex justify-center">
            <div
              className="absolute inset-0 blur-2xl opacity-40 -z-10"
              style={{ background: "radial-gradient(circle, rgba(212,160,23,0.45) 0%, transparent 70%)" }}
            />
            <Image
              src="/narunthingal_sketched_logo.png"
              alt="Narunthingal"
              width={340}
              height={96}
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_24px_rgba(212,160,23,0.35)]"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            Narunthingal{" "}
            <span style={{ color: "#D4A017" }}>&apos;27</span>
          </h1>
          <div className="gold-divider max-w-xs mx-auto my-4" />
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
            Welcome, {name ?? email.split("@")[0]}
          </p>
          <DeadlineCountdown />
        </div>

        {/* Cards */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-16 grid sm:grid-cols-2 gap-5 content-start">
          {/* Apply */}
          <div className="card flex flex-col gap-4">
            <div>
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
            ) : deadlinePassed ? (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}
              >
                <p className="font-medium" style={{ color: "#fca5a5" }}>🔒 Applications closed</p>
                <p className="mt-1 text-xs" style={{ color: "rgba(252,165,165,0.65)" }}>
                  Deadline was 28 Oct 2026 at 8:00 PM
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
              <h2 className="text-lg font-semibold text-white mb-1">Voting</h2>
              <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                Participate in active committee votes. Your IIT login ensures one vote per person.
              </p>
            </div>
            {admin && (voteCount ?? 0) > 0 ? (
              <div className="flex flex-col gap-3">
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)" }}
                >
                  <p className="font-medium" style={{ color: "#D4A017" }}>
                    {voteCount} active vote{voteCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href="/vote" className="btn-primary text-center block">
                  Go to Voting
                </Link>
              </div>
            ) : admin ? (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                No active votes right now. Check back later.
              </div>
            ) : (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Voting opens soon. Check back later.
              </div>
            )}
          </div>

          {/* Admin — occupies full grid width, then splits into its own 3-col row */}
          {admin && (
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin: Candidates</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    View, filter, sort, and search all submitted applications.
                  </p>
                </div>
                <Link href="/admin/candidates" className="btn-secondary text-center mt-auto block">
                  View Applications
                </Link>
              </div>

              {/* Admin: Selections card hidden — restore when needed
              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin: Selections</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Review applicants per role and mark your final selections.
                  </p>
                </div>
                <Link href="/admin/selections" className="btn-secondary text-center mt-auto block">
                  Manage Selections
                </Link>
              </div>
              */}

              <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Admin: Voting</h2>
                  <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Create voting events, manage candidates, and see live results.
                  </p>
                </div>
                <Link href="/admin/voting" className="btn-secondary text-center mt-auto block">
                  Manage Voting
                </Link>
              </div>

              {superAdmin && (
                <div className="card flex flex-col gap-4" style={{ borderColor: "rgba(212,160,23,0.3)" }}>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Admin: Access</h2>
                    <p className="text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
                      Add or remove admin access for other IIT email addresses.
                    </p>
                  </div>
                  <Link href="/admin/admins" className="btn-secondary text-center mt-auto block">
                    Manage Admins
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className="relative max-w-4xl mx-auto px-4 pt-6 pb-8 mt-4"
          style={{ borderTop: "1px solid rgba(212,160,23,0.12)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Left — brand & credits */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(212,160,23,0.5)" }}>
                Narunthingal &apos;27
              </p>
              <p className="text-xs" style={{ color: "rgba(245,240,232,0.22)" }}>
                Developed by Anusigan Sivananthan, Linushankaran Janarththanan &amp; Lagshan Rathinavel
              </p>
            </div>

            {/* Right — technical support */}
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(245,240,232,0.25)" }}>
                Technical issues
              </p>
              <a href="tel:+94775810310" className="flex items-center justify-between gap-8 group">
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>Anusigan Sivananthan</span>
                <span className="text-xs tabular-nums" style={{ color: "rgba(212,160,23,0.55)" }}>+94 77 581 0310</span>
              </a>
              <a href="tel:+94779285488" className="flex items-center justify-between gap-8 group">
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>Linushankaran Janarththanan</span>
                <span className="text-xs tabular-nums" style={{ color: "rgba(212,160,23,0.55)" }}>+94 77 928 5488</span>
              </a>
              <a href="tel:+94765327251" className="flex items-center justify-between gap-8 group">
                <span className="text-xs" style={{ color: "rgba(245,240,232,0.45)" }}>Lagshan Rathinavel</span>
                <span className="text-xs tabular-nums" style={{ color: "rgba(212,160,23,0.55)" }}>+94 76 532 7251</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
