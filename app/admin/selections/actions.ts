"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminAsync } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function selectCandidate(applicationId: string, role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!(await isAdminAsync(user.email!, supabase))) throw new Error("Not authorized");

  const { error } = await supabase.from("selections").upsert({
    application_id: applicationId,
    role,
    selected_by: user.email,
  }, { onConflict: "application_id,role" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/selections");
}

export async function deselectCandidate(applicationId: string, role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!(await isAdminAsync(user.email!, supabase))) throw new Error("Not authorized");

  const { error } = await supabase
    .from("selections")
    .delete()
    .eq("application_id", applicationId)
    .eq("role", role);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/selections");
}
