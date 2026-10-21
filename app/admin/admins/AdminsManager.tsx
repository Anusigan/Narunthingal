"use client";

import { useState, useTransition } from "react";
import { addAdmin, removeAdmin } from "./actions";

interface Admin {
  id: string;
  email: string;
  added_by: string | null;
  added_at: string;
}

export default function AdminsManager({
  admins,
  currentEmail,
}: {
  admins: Admin[];
  currentEmail: string;
}) {
  const [list, setList] = useState<Admin[]>(admins);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await addAdmin(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setEmail("");
      }
    });
  }

  function handleRemove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeAdmin(id);
      if (res.error) {
        setError(res.error);
      } else {
        setList((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Add Admin</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@iit.ac.lk"
            required
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 min-w-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add"}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>

      {/* Current admins */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">
          Current Admins ({list.length})
        </h2>
        <div className="flex flex-col gap-2">
          {list.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{admin.email}</p>
                {admin.added_by && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(245,240,232,0.35)" }}>
                    Added by {admin.added_by} · {new Date(admin.added_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {admin.email.toLowerCase() !== currentEmail.toLowerCase() ? (
                <button
                  onClick={() => handleRemove(admin.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1 rounded-md disabled:opacity-40 transition-colors"
                  style={{
                    color: "#f87171",
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  Remove
                </button>
              ) : (
                <span
                  className="text-xs px-3 py-1 rounded-md"
                  style={{ color: "#D4A017", background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)" }}
                >
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
