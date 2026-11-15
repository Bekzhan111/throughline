"use client";

import SiteHeader from "@/components/SiteHeader";
import { getSupabase } from "@/lib/supabase";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/programs";
  const [mode, setMode] = useState<"in" | "up">(search.get("mode") === "in" ? "in" : "up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace(dest);
    });
  }, [dest, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "up") {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not create the account.");
      }
      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw new Error(mode === "up" ? "Account created, but sign-in failed. Try signing in." : "Email or password is wrong.");
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader cta={false} />
      <main className="auth-wrap">
        <form className="card auth-card" onSubmit={submit}>
          <span className={`tile big ${mode === "up" ? "tone-green" : "tone-blue"}`}>
            {mode === "up" ? <UserPlus size={26} aria-hidden /> : <LogIn size={26} aria-hidden />}
          </span>
          <h1>{mode === "up" ? "Create your account" : "Welcome back"}</h1>
          <p className="lede">
            {mode === "up"
              ? "Your place in the program, your scores, and your actions are saved to this account."
              : "Sign in to pick up the program where you left it."}
          </p>
          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            {mode === "up" ? "Password (at least 6 characters)" : "Password"}
            <input
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary big block" disabled={busy} type="submit">
            {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
          </button>
          <button
            className="textbtn"
            type="button"
            onClick={() => {
              setMode(mode === "up" ? "in" : "up");
              setError("");
            }}
          >
            {mode === "up" ? "I already have an account" : "Create an account"}
          </button>
        </form>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="shell">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
