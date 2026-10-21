"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { useState } from "react";
import Image from "next/image";

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
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8,7,6,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,160,23,0.2)",
        boxShadow: "0 2px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/narunthingal-logo.jpg"
            alt="Narunthingal"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="font-bold text-base tracking-widest uppercase" style={{ color: "#D4A017", letterSpacing: "0.15em" }}>
            Narunthingal
          </span>
          {admin && (
            <span
              className="badge text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.3)" }}
            >
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
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
              style={
                pathname === l.href
                  ? { background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.25)" }
                  : { color: "rgba(245,240,232,0.5)" }
              }
              onMouseOver={e => { if (pathname !== l.href) { (e.currentTarget as HTMLElement).style.color = "#f5f0e8"; } }}
              onMouseOut={e => { if (pathname !== l.href) { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)"; } }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs max-w-[180px] truncate" style={{ color: "rgba(245,240,232,0.4)" }}>
            {name ?? email}
          </span>
          <button
            onClick={signOut}
            disabled={signing}
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(245,240,232,0.4)" }}
            onMouseOver={e => ((e.currentTarget as HTMLElement).style.color = "#fca5a5")}
            onMouseOut={e => ((e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.4)")}
          >
            {signing ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
