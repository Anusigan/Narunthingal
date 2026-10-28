import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminAsync } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Unauthorized from "@/components/Unauthorized";

export default async function AdminVolunteersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isAdminAsync(user.email!, supabase))) return <Unauthorized />;

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  const { data: volunteers } = await supabase
    .from("volunteers")
    .select("*")
    .order("submitted_at", { ascending: false });

  const list = volunteers ?? [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)" }}
    >
      <Navbar email={email} name={name} isAdmin={true} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Volunteer Responses</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
            {list.length} registration{list.length !== 1 ? "s" : ""} received
          </p>
          <div className="gold-divider mt-3" />
        </div>

        {list.length === 0 ? (
          <div className="card text-center py-12" style={{ color: "rgba(245,240,232,0.35)" }}>
            No volunteer registrations yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((v: any) => (
              <div key={v.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-white text-base">{v.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>
                      {v.degree_pathway} · {v.current_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={`https://wa.me/94${v.contact_number.slice(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25d366" }}
                    >
                      WhatsApp
                    </a>
                    <span className="text-xs tabular-nums" style={{ color: "rgba(245,240,232,0.35)" }}>
                      {new Date(v.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(v.volunteering_avenues as string[]).map((a) => (
                    <span
                      key={a}
                      className="text-xs rounded-full px-3 py-1"
                      style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: "#D4A017" }}
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {(v.volunteering_avenues as string[]).map((avenue: string) => (
                    <div key={avenue}>
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "rgba(212,160,23,0.5)" }}>
                        Why suitable: {avenue}
                      </p>
                      <p className="text-sm" style={{ color: "rgba(245,240,232,0.7)" }}>
                        {(v.suitability_reasons as Record<string, string>)?.[avenue] ?? "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
