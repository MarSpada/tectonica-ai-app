"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const reset = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Handle Supabase implicit flow: PASSWORD_RECOVERY event from hash tokens
  // Also parse hash errors (e.g. expired reset links)
  useEffect(() => {
    const supabase = createClient();

    // Check for error in hash fragment (e.g. expired reset link)
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        setError(errorDesc.replace(/\+/g, " "));
      }
    }

    // Listen for auth state changes — catch PASSWORD_RECOVERY from hash tokens
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/reset-password";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Header */}
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
          Movement Intelligence
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </p>
      </div>

      {/* Confirmation / reset banners */}
      {confirmed && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 text-center mb-4">
          Email confirmed! Please sign in.
        </p>
      )}
      {reset && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 text-center mb-4">
          Password updated! Please sign in with your new password.
        </p>
      )}

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card-bg rounded-2xl shadow-sm border border-card-stroke p-6 space-y-4"
      >
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              placeholder="Ned Howey"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Password
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
          {!isSignUp && (
            <Link
              href="/forgot-password"
              className="block text-xs text-accent-purple hover:underline mt-1.5 text-right"
            >
              Forgot password?
            </Link>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {message && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent-purple text-white text-sm font-semibold hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Loading..."
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      {/* Toggle sign in / sign up */}
      <p className="text-center text-sm text-text-secondary mt-4">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="font-medium text-accent-purple hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
