import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminAsync } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Unauthorized from "@/components/Unauthorized";
import VolunteerForm from "./VolunteerForm";

export default async function VolunteerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isAdminAsync(user.email!, supabase))) return <Unauthorized />;

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)" }}
    >
      <Navbar email={email} name={name} isAdmin={true} />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Volunteer Registration</h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>
            Register your interest to volunteer for Narunthingal &apos;27.
          </p>
          <div className="gold-divider mt-4" />
        </div>
        <VolunteerForm />
      </div>
    </div>
  );
}
