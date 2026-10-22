"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// TEMPORARY: while true, Google sign-in is admin-only and the three
// test voter accounts sign in with email + password instead.
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";


function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="sp">
      <div className="sp-glow" />

      {/* Title image — mix-blend-mode:screen drops the black bg, leaves only the gold */}
      <img
        src="/narunthingal-title.webp"
        alt="நருந்திங்கள் 2027"
        className="sp-title"
      />

      <p className="sp-tag">Organizing Committee Portal</p>

      <style>{`
        .sp {
          position: fixed; inset: 0; z-index: 100; background: #080706;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: spExit 5.4s ease forwards;
          pointer-events: none;
        }
        @keyframes spExit { 0%, 74% { opacity: 1; } 100% { opacity: 0; } }

        .sp-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 55% 45% at 50% 50%,
            rgba(212,160,23,0.14) 0%, transparent 65%);
          animation: spGlow 5.4s ease forwards;
        }
        @keyframes spGlow {
          0% { opacity: 0; } 18% { opacity: 1; } 74% { opacity: 1; } 100% { opacity: 0; }
        }

        /* Title image */
        .sp-title {
          position: relative; z-index: 2;
          width: min(680px, 92vw);
          mix-blend-mode: screen;
          opacity: 0; animation: spFadeUp 0.9s ease 0.3s forwards;
        }

        .sp-tag {
          position: relative; z-index: 2; margin: 4px 0 0;
          font-size: 0.52rem; font-weight: 400; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(212,160,23,0.3); opacity: 0;
          animation: spFadeUp 0.55s ease 1.0s forwards;
        }
        @keyframes spFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const [showSplash, setShowSplash] = useState(true);
  const [visible, setVisible] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 5100);
    return () => clearTimeout(t);
  }, []);

  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [testError, setTestError] = useState<string | null>(null);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (signingIn) return;
    setSigningIn(true);
    setTestError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail.trim().includes("@")
        ? testEmail.trim()
        : `${testEmail.trim()}@iit.ac.lk`,
      password: testPassword,
    });
    if (error) {
      setTestError(error.message);
      setSigningIn(false);
      return;
    }
    window.location.href = "/";
  }

  async function signInWithGoogle() {
    if (signingIn) return;
    setSigningIn(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div
        className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease",
          background: "linear-gradient(175deg, #1a1200 0%, #0f0b02 18%, #090806 45%, #050403 100%)",
        }}
      >
        {/* Radial glow behind card */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480, height: 480,
            background: "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 68%)",
          }}
        />

        <div className="relative w-full max-w-xs">
          {/* Logo + title */}

          {/* Sign-in card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(11,8,4,0.92)",
              border: "1px solid rgba(212,160,23,0.18)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,160,23,0.07)",
            }}
          >
            {/* Top gold line */}
            <div className="gold-divider" />

            <div className="px-7 py-7">
              <p className="text-sm font-semibold text-white mb-1">
                Sign in to apply
              </p>
              <p className="text-xs mb-6" style={{ color: "rgba(245,240,232,0.38)" }}>
                Restricted to{" "}
                <span style={{ color: "rgba(212,160,23,0.85)", fontWeight: 600 }}>
                  @iit.ac.lk
                </span>{" "}
                accounts only
              </p>

              {error === "domain" && (
                <div
                  className="mb-5 rounded-lg px-4 py-3 text-xs"
                  style={{
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  Only <strong>@iit.ac.lk</strong> addresses can access this portal.
                </div>
              )}
              {error === "auth" && (
                <div
                  className="mb-5 rounded-lg px-4 py-3 text-xs"
                  style={{
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  Authentication failed. Please try again.
                </div>
              )}

              {TEST_MODE && (
                <form onSubmit={signInWithPassword} className="flex flex-col gap-3 mb-5">
                  <p className="text-xs" style={{ color: "rgba(212,160,23,0.85)" }}>
                    Test accounts
                  </p>
                  <input
                    className="input"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Username (e.g. testvoter1)"
                    required
                  />
                  <input
                    className="input"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                  {testError && (
                    <p className="text-xs" style={{ color: "#fca5a5" }}>{testError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full text-sm font-medium rounded-xl px-4 py-3 google-btn disabled:opacity-60"
                  >
                    {signingIn ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              )}

              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl px-4 py-3 google-btn disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {signingIn ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                    style={{ borderColor: "rgba(0,0,0,0.3)", borderTopColor: "#111" }}
                  />
                ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                )}
                {signingIn ? "Redirecting…" : TEST_MODE ? "Admin sign-in with Google" : "Continue with Google"}
              </button>

              <p
                className="mt-5 text-xs text-center leading-relaxed"
                style={{ color: "rgba(245,240,232,0.22)" }}
              >
                Use your IIT Google Workspace account.
                <br />
                Personal Gmail accounts will be rejected.
              </p>
            </div>

            {/* Bottom gold line */}
            <div className="gold-divider" />
          </div>

        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
