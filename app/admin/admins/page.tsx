import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Unauthorized from "@/components/Unauthorized";
import { isAdminAsync, isSuperAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import AdminsManager from "./AdminsManager";

export default async function AdminsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await isAdminAsync(user.email!, supabase))) return <Unauthorized />;
  if (!isSuperAdmin(user.email)) return <Unauthorized />;

  const { data: admins } = await supabase
    .from("admins")
    .select("id, email, added_by, added_at")
    .order("added_at", { ascending: true });

  const email = user.email!;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="min-h-screen">
      <Navbar email={email} name={name} isAdmin={true} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
            Add or remove admin access for IIT email addresses.
          </p>
          <div className="gold-divider mt-3" />
        </div>
        <AdminsManager
          admins={admins ?? []}
          currentEmail={email}
        />
      </div>
    </div>
  );
}
