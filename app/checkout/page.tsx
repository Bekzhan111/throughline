"use client";

import SiteHeader from "@/components/SiteHeader";
import { dollars, priceLine, PRICES, safeNext, type PlanInterval } from "@/lib/billing";
import { getSupabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Checkout() {
  const router = useRouter();
  const search = useSearchParams();
  const rawInterval = search.get("interval");
  const interval: PlanInterval | null = rawInterval === "year" || rawInterval === "month" ? rawInterval : null;
  const next = safeNext(search.get("next"));
  const [ready, setReady] = useState(false);
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!interval) {
      router.replace("/pricing");
      return;
    }
    getSupabase().auth.getSession().then(({ data }) => {
      if (!data.session) {
        const dest = `/checkout?interval=${interval}&next=${encodeURIComponent(next)}`;
        router.replace(`/login?mode=in&next=${encodeURIComponent(dest)}`);
        return;
      }
      setReady(true);
    });
  }, [interval, next, router]);

  function onNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
  }

  function onExp(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setExp(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!interval) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to pay.");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interval, number, exp, cvc }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The payment did not go through.");
      setPaid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The payment did not go through.");
    } finally {
      setBusy(false);
    }
  }

  if (!interval || !ready) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">Loading checkout…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-wrap">
        <form className="card auth-card" onSubmit={submit}>
          <span className="tag tone-gold">Test mode</span>
          <h1>{paid ? "You're on Pro" : "Checkout"}</h1>
          {paid ? (
            <>
              <p className="lede">Pro is {priceLine(interval)}. This was a test payment, so nothing was charged.</p>
              <Link className="btn primary block" href={next}>
                Continue
                <ArrowRight size={18} aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <p className="lede">
                Pro, {priceLine(interval)}. Use card 4242 4242 4242 4242, any future date, and any 3-digit code.
              </p>
              <div className="checkout-due">
                <span>Due today</span>
                <strong>{dollars(PRICES[interval])}</strong>
              </div>
              <label>
                Card number
                <input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  value={number}
                  onChange={(event) => onNumber(event.target.value)}
                  required
                />
              </label>
              <div className="checkout-row">
                <label>
                  Expiry
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="12/28"
                    value={exp}
                    onChange={(event) => onExp(event.target.value)}
                    required
                  />
                </label>
                <label>
                  CVC
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={cvc}
                    onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    required
                  />
                </label>
              </div>
              {error && <div className="form-error">{error}</div>}
              <button className="btn primary block" type="submit" disabled={busy}>
                {busy ? "Paying…" : `Pay ${dollars(PRICES[interval])}`}
              </button>
              <Link className="textbtn" href={`/paywall?next=${encodeURIComponent(next)}&stay=1`}>
                Back to plans
              </Link>
            </>
          )}
        </form>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <main className="shell">
            <p className="lede">Loading checkout…</p>
          </main>
        </>
      }
    >
      <Checkout />
    </Suspense>
  );
}
