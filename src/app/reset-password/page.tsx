"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle auth token from Supabase redirect (PKCE code or implicit hash tokens)
  useEffect(() => {
    const supabase = createClient();

    // PKCE flow: exchange code from query params
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          window.location.href = "/login#error=access_denied&error_description=" +
            encodeURIComponent(error.message);
        } else {
          setReady(true);
          // Clean URL
          window.history.replaceState({}, "", "/reset-password");
        }
      });
      return;
    }

    // Implicit flow: Supabase client auto-detects hash tokens
    // Check for hash errors (expired link)
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        window.location.href = "/login#" + window.location.hash.substring(1);
        return;
      }
    }

    // Listen for session — Supabase client picks up hash tokens automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Check if already has a session (direct navigation)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Sign out so they log in with the new password
      await supabase.auth.signOut();
      window.location.href = "/login?reset=true";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-color.png"
            alt="Tectonica.AI"
            className="h-10 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="text-2xl font-bold text-text-primary">
            Set New Password
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter your new password below.
          </p>
        </div>

        {!ready ? (
          <div className="bg-card-bg rounded-2xl shadow-sm border border-card-stroke p-6 text-center">
            <p className="text-sm text-text-secondary">Verifying your reset link...</p>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-card-bg rounded-2xl shadow-sm border border-card-stroke p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent-purple text-white text-sm font-semibold hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
