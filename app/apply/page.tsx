import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ApplyForm from "./ApplyForm";

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if already applied
  const { data: existing } = await supabase
    .from("applications")
    .select("id, first_preference, second_preference, second_preference_reason, submitted_at")
    .eq("user_id", user.id)
    .single();

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {existing ? "Your Application" : "Apply for Narunthingal Organizing Committee '27"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
            {existing
              ? "You have already submitted your application. See your responses below."
              : "Fill in the form below to apply for a position in the Narunthingal organizing committee."}
          </p>
          <div className="gold-divider mt-4" />
        </div>

        {/* Contact card */}
        <div
          className="rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.18)" }}
        >
          <p className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>
            Questions or inquiries about the application?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "rgba(212,160,23,0.6)" }}>Chairman</p>
              <p className="text-white font-medium">Saranujan Gunanesan</p>
              <a href="tel:+94774113969" className="tabular-nums" style={{ color: "rgba(245,240,232,0.5)" }}>+94 77 411 3969</a>
            </div>
            <div className="hidden sm:block w-px" style={{ background: "rgba(212,160,23,0.2)" }} />
            <div>
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "rgba(212,160,23,0.6)" }}>Co-Chairman</p>
              <p className="text-white font-medium">Anusigan Sivananthan</p>
              <a href="tel:+94775810310" className="tabular-nums" style={{ color: "rgba(245,240,232,0.5)" }}>+94 77 581 0310</a>
            </div>
          </div>
        </div>

        {existing ? (
          <div className="card" style={{ borderColor: "rgba(16,185,129,0.25)" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full" style={{ background: "#34d399" }} />
              <span className="font-medium" style={{ color: "#34d399" }}>
                Application received
              </span>
              <span className="text-sm ml-auto" style={{ color: "rgba(245,240,232,0.35)" }}>
                {new Date(existing.submitted_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <dl className="grid gap-3">
              <div>
                <dt className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.6)" }}>
                  First Preference
                </dt>
                <dd className="text-white font-semibold mt-0.5">
                  {existing.first_preference}
                </dd>
              </div>
              {existing.second_preference && (
                <div>
                  <dt className="text-xs uppercase tracking-wide" style={{ color: "rgba(212,160,23,0.6)" }}>
                    Alternate Role Preference
                  </dt>
                  <dd className="text-white mt-0.5">
                    {existing.second_preference}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-6 text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
              Applications are final. Contact the admin team if you need to make changes.
            </p>
          </div>
        ) : (
          <ApplyForm
            userId={user.id}
            email={email}
            defaultName={name ?? ""}
          />
        )}
      </div>
    </div>
  );
}
