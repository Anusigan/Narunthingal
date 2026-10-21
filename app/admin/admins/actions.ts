"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminAsync } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function addAdmin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminAsync(user.email, supabase))) {
    return { error: "Unauthorized" };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required" };
  if (!email.endsWith("@iit.ac.lk")) return { error: "Only @iit.ac.lk emails are allowed" };

  const { error } = await supabase.from("admins").insert({
    email,
    added_by: user.email,
  });

  if (error) {
    if (error.code === "23505") return { error: "This email is already an admin" };
    return { error: error.message };
  }

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function removeAdmin(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminAsync(user.email, supabase))) {
    return { error: "Unauthorized" };
  }

  // Prevent removing yourself
  const { data: target } = await supabase
    .from("admins")
    .select("email")
    .eq("id", id)
    .single();

  if (target?.email?.toLowerCase() === user.email?.toLowerCase()) {
    return { error: "You cannot remove yourself as admin" };
  }

  const { error } = await supabase.from("admins").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/admins");
  return { success: true };
}
