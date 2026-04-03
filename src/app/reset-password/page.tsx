"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for a valid session before showing the password form.
  // The session comes from the auth callback (server-side PKCE exchange)
  // or from the Supabase client auto-processing hash tokens (implicit flow).
  useEffect(() => {
    const supabase = createClient();

    // Check for hash errors (expired/invalid link)
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        window.location.href = "/login#" + window.location.hash.substring(1);
        return;
      }
    }

    // Listen for auth events from Supabase client's auto token processing
    // PASSWORD_RECOVERY fires for implicit flow, SIGNED_IN for PKCE flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Check if session already exists (from server-side callback exchange)
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
      <div className="w-full max-w-md">
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
          className="bg-card-bg rounded-2xl shadow-sm border border-card-stroke p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
        )}
      </div>
    </div>
  );
}
