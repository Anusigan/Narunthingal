"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminAsync } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function deleteApplication(applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  if (!(await isAdminAsync(user.email!, supabase))) throw new Error("Not authorized");

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/candidates");
}
