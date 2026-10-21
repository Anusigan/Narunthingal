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
  const [menuOpen, setMenuOpen] = useState(false);
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
          { href: "/admin/admins", label: "Manage Admins" },
          { href: "/admin/analytics", label: "Analytics" },
        ]
      : []),
  ];

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(8,7,6,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,160,23,0.2)",
        boxShadow: "0 2px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Image
            src="/narunthingal-logo.jpg"
            alt="Narunthingal"
            width={30}
            height={30}
            className="rounded-md shrink-0"
          />
          <span className="font-bold text-sm sm:text-base uppercase" style={{ color: "#D4A017", letterSpacing: "0.08em" }}>
            Narunthingal
          </span>
          {admin && (
            <span
              className="hidden sm:inline-flex badge text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(212,160,23,0.15)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.3)" }}
            >
              Admin
            </span>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${pathname === l.href ? "nav-link-active" : "nav-link"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs max-w-[180px] truncate" style={{ color: "rgba(245,240,232,0.4)" }}>
            {name ?? email}
          </span>
          <button
            onClick={signOut}
            disabled={signing}
            className="hidden sm:block text-xs signout-btn"
          >
            {signing ? "Signing out…" : "Sign out"}
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span
              className="block w-5 h-0.5 transition-all duration-200"
              style={{
                background: "#D4A017",
                transform: menuOpen ? "translateY(8px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-200"
              style={{
                background: "#D4A017",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-200"
              style={{
                background: "#D4A017",
                transform: menuOpen ? "translateY(-8px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="sm:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: "1px solid rgba(212,160,23,0.12)" }}
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm font-medium"
              style={
                pathname === l.href
                  ? { background: "rgba(212,160,23,0.12)", color: "#D4A017" }
                  : { color: "rgba(245,240,232,0.7)" }
              }
            >
              {l.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid rgba(212,160,23,0.1)" }} className="mt-2 pt-3 flex items-center justify-between">
            <span className="text-xs truncate" style={{ color: "rgba(245,240,232,0.4)" }}>
              {name ?? email}
            </span>
            <button
              onClick={() => { setMenuOpen(false); signOut(); }}
              disabled={signing}
              className="text-xs ml-4 shrink-0"
              style={{ color: "rgba(245,240,232,0.4)" }}
            >
              {signing ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
