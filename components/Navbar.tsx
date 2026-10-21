"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { useState } from "react";

interface NavbarProps {
  email: string;
  name?: string | null;
}

export default function Navbar({ email, name }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signing, setSigning] = useState(false);

  const admin = isAdmin(email);

  async function signOut() {
    setSigning(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/apply", label: "Apply" },
    { href: "/vote", label: "Vote" },
    ...(admin
      ? [
          { href: "/admin/candidates", label: "Candidates" },
          { href: "/admin/voting", label: "Manage Voting" },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-purple-400 text-lg tracking-tight"
        >
          <span className="text-amber-400">🌸</span> Narunthingal
          {admin && (
            <span className="badge bg-purple-900 text-purple-300 ml-1">
              Admin
            </span>
          )}
        </Link>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-purple-900/60 text-purple-300"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-gray-500 max-w-[180px] truncate">
            {name ?? email}
          </span>
          <button
            onClick={signOut}
            disabled={signing}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            {signing ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
