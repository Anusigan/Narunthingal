"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Hint to show Google account picker
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-900/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Narunthingal
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Organizing Committee Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-100 mb-1">
            Sign in to apply
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Only{" "}
            <span className="text-purple-400 font-medium">@iit.ac.lk</span>{" "}
            addresses are accepted.
          </p>

          {/* Error messages */}
          {error === "domain" && (
            <div className="mb-5 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
              Only <strong>@iit.ac.lk</strong> email addresses can access this
              portal. Please sign in with your IIT account.
            </div>
          )}
          {error === "auth" && (
            <div className="mb-5 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
              Authentication failed. Please try again.
            </div>
          )}

          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg px-4 py-3 transition-colors duration-150"
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-5 text-xs text-gray-500 text-center">
            Use your IIT Google Workspace account to continue.
            <br />
            Personal Gmail accounts will be rejected.
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          நேர்மையான ஊழியம் • Honest Service
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
