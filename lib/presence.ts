import type { RealtimeChannel, SupabaseClient, User } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export interface OnlineUser {
  user_id: string;
  email: string;
  admin: boolean;
}

// One shared presence channel per browser tab, so the navbar (which tracks
// the signed-in user) and the live voting screen (which reads the list)
// don't fight over the same channel topic.
let channel: RealtimeChannel | null = null;
let trackedUserId: string | null = null;
let current: OnlineUser[] = [];
const listeners = new Set<(users: OnlineUser[]) => void>();

export function startPresence(supabase: SupabaseClient, user: User) {
  if (channel && trackedUserId === user.id) return;
  if (channel) supabase.removeChannel(channel);

  trackedUserId = user.id;
  const ch = supabase.channel("online-users", {
    config: { presence: { key: user.id } },
  });

  ch.on("presence", { event: "sync" }, () => {
    const state = ch.presenceState<OnlineUser>();
    current = Object.values(state)
      .map((metas) => metas[0])
      .filter(Boolean);
    listeners.forEach((l) => l(current));
  });

  ch.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await ch.track({
        user_id: user.id,
        email: user.email ?? "",
        admin: isAdmin(user.email),
      });
    }
  });

  channel = ch;
}

export function onPresence(cb: (users: OnlineUser[]) => void) {
  listeners.add(cb);
  cb(current);
  return () => {
    listeners.delete(cb);
  };
}

export function stopPresence(supabase: SupabaseClient) {
  if (channel) supabase.removeChannel(channel);
  channel = null;
  trackedUserId = null;
  current = [];
  listeners.forEach((l) => l(current));
}
