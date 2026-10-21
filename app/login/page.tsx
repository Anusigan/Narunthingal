"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";

const SPLASH_EN = "NARUNTHINGAL".split("");

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="sp">
      <div className="sp-glow" />

      {/* Kolam geometric pattern — draws itself, then text appears over it */}
      <svg className="sp-kolam" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
           fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer octagon */}
        <path className="spk-oct" pathLength="1" stroke="rgba(212,160,23,0.35)" strokeWidth="0.8"
          d="M200,45 L310,90 L355,200 L310,310 L200,355 L90,310 L45,200 L90,90 Z"/>
        {/* Inner diamond */}
        <path className="spk-dia" pathLength="1" stroke="rgba(212,160,23,0.45)" strokeWidth="0.9"
          d="M200,110 L290,200 L200,290 L110,200 Z"/>
        {/* Central rotated square */}
        <path className="spk-sq" pathLength="1" stroke="rgba(212,160,23,0.35)" strokeWidth="0.8"
          d="M155,155 L245,155 L245,245 L155,245 Z"/>
        {/* 4 cardinal lotus petals */}
        <path className="spk-pN" pathLength="1" stroke="rgba(212,160,23,0.7)" strokeWidth="1.1"
          d="M200,200 C224,176 224,126 200,110 C176,126 176,176 200,200"/>
        <path className="spk-pE" pathLength="1" stroke="rgba(212,160,23,0.7)" strokeWidth="1.1"
          d="M200,200 C224,224 274,224 290,200 C274,176 224,176 200,200"/>
        <path className="spk-pS" pathLength="1" stroke="rgba(212,160,23,0.7)" strokeWidth="1.1"
          d="M200,200 C176,224 176,274 200,290 C224,274 224,224 200,200"/>
        <path className="spk-pW" pathLength="1" stroke="rgba(212,160,23,0.7)" strokeWidth="1.1"
          d="M200,200 C176,176 126,176 110,200 C126,224 176,224 200,200"/>
        {/* Diagonal connectors: square corners → octagon corners */}
        <path className="spk-dNE" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M245,155 L310,90"/>
        <path className="spk-dSE" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M245,245 L310,310"/>
        <path className="spk-dSW" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M155,245 L90,310"/>
        <path className="spk-dNW" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M155,155 L90,90"/>
        {/* Cardinal spokes: inner diamond → outer octagon */}
        <path className="spk-rN" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M200,110 L200,45"/>
        <path className="spk-rE" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M290,200 L355,200"/>
        <path className="spk-rS" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M200,290 L200,355"/>
        <path className="spk-rW" pathLength="1" stroke="rgba(212,160,23,0.28)" strokeWidth="0.7"
          d="M110,200 L45,200"/>
        {/* Dots at all key vertices */}
        {([
          [200,45,3.5],[310,90,3],[355,200,3.5],[310,310,3],
          [200,355,3.5],[90,310,3],[45,200,3.5],[90,90,3],
          [200,110,3.5],[290,200,3.5],[200,290,3.5],[110,200,3.5],
          [155,155,2.5],[245,155,2.5],[245,245,2.5],[155,245,2.5],
        ] as [number,number,number][]).map(([cx,cy,r],i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill={r > 3 ? "rgba(212,160,23,0.75)" : "rgba(212,160,23,0.55)"}
            className="spk-dot"/>
        ))}
        {/* Center dot */}
        <circle cx="200" cy="200" r="5" fill="#E8B820" className="spk-dot"/>
      </svg>

      {/* Hero text */}
      <div className="sp-word" aria-label="Narunthingal">
        {SPLASH_EN.map((l, i) => (
          <span key={i} className="sp-letter" style={{ animationDelay: `${1500 + i * 68}ms` }}>
            {l}
          </span>
        ))}
      </div>

      <div className="sp-rule" />
      <p className="sp-year">2 0 2 7</p>
      <p className="sp-tag">Organizing Committee Portal</p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');

        .sp {
          position: fixed; inset: 0; z-index: 100; background: #080706;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: spExit 5.4s ease forwards;
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

        /* Kolam SVG */
        .sp-kolam {
          position: absolute; width: 440px; height: 440px; pointer-events: none;
          opacity: 0; animation: spKolam 5.4s ease forwards;
        }
        @keyframes spKolam {
          0% { opacity: 0; } 6% { opacity: 1; } 74% { opacity: 0.55; } 100% { opacity: 0; }
        }

        /* Path draw — pathLength=1 so dasharray/offset use [0,1] */
        .spk-oct { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 1.1s ease 0.1s forwards; }
        .spk-dia { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.8s ease 0.5s forwards; }
        .spk-sq  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.6s ease 0.8s forwards; }
        .spk-pN  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.5s ease 0.95s forwards; }
        .spk-pE  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.5s ease 1.05s forwards; }
        .spk-pS  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.5s ease 1.15s forwards; }
        .spk-pW  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.5s ease 1.25s forwards; }
        .spk-dNE { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.35s ease 1.05s forwards; }
        .spk-dSE { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.35s ease 1.15s forwards; }
        .spk-dSW { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.35s ease 1.25s forwards; }
        .spk-dNW { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.35s ease 1.35s forwards; }
        .spk-rN  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.3s ease 1.05s forwards; }
        .spk-rE  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.3s ease 1.15s forwards; }
        .spk-rS  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.3s ease 1.25s forwards; }
        .spk-rW  { stroke-dasharray:1; stroke-dashoffset:1; animation: spDraw 0.3s ease 1.35s forwards; }
        .spk-dot { opacity:0; animation: spFd 0.3s ease 0.15s forwards; }
        @keyframes spDraw { to { stroke-dashoffset: 0; } }
        @keyframes spFd   { to { opacity: 1; } }

        /* Hero word */
        .sp-word { position: relative; z-index: 2; display: flex; gap: 0; }
        .sp-letter {
          font-family: 'Cinzel Decorative', 'Times New Roman', serif;
          font-size: 2.4rem; font-weight: 700; letter-spacing: 0.1em;
          color: #E8B820;
          text-shadow:
            0 0 14px rgba(232,184,32,1),
            0 0 40px rgba(212,160,23,0.55),
            0 0 80px rgba(212,160,23,0.2);
          opacity: 0; transform: translateY(10px);
          animation: spLetterIn 0.45s ease-out forwards;
        }
        @keyframes spLetterIn { to { opacity: 1; transform: translateY(0); } }

        .sp-rule {
          position: relative; z-index: 2; height: 1px; width: 0; margin: 18px 0 0;
          background: linear-gradient(90deg, transparent, rgba(212,160,23,0.6) 50%, transparent);
          animation: spRule 0.55s ease 2.7s forwards;
        }
        @keyframes spRule { from { width:0; opacity:0; } to { width:220px; opacity:1; } }

        .sp-year {
          position: relative; z-index: 2; margin: 14px 0 0;
          font-size: 0.65rem; font-weight: 300; letter-spacing: 0.45em;
          color: rgba(212,160,23,0.5); opacity: 0;
          animation: spFadeUp 0.55s ease 3.0s forwards;
        }
        .sp-tag {
          position: relative; z-index: 2; margin: 8px 0 0;
          font-size: 0.52rem; font-weight: 400; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(212,160,23,0.25); opacity: 0;
          animation: spFadeUp 0.55s ease 3.3s forwards;
        }
        @keyframes spFadeUp {
          from { opacity: 0; transform: translateY(6px); }
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

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 5100);
    return () => clearTimeout(t);
  }, []);

  async function signInWithGoogle() {
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
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        {/* Background */}
        <Image src="/narunthingal-bg.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0" style={{ background: "rgba(8,7,6,0.80)" }} />

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

              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl px-4 py-3 transition-all duration-200"
                style={{
                  background: "#ffffff",
                  color: "#111111",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "0 2px 24px rgba(0,0,0,0.45)";
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
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
