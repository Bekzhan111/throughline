"use client";

import PlanChoices from "@/components/PlanChoices";
import SiteHeader from "@/components/SiteHeader";
import { FREE_PASS, loadBilling, safeNext, type Billing } from "@/lib/billing";
import { getSupabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Paywall() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const stay = search.get("stay") === "1";
  const [signedIn, setSignedIn] = useState(false);
  const [current, setCurrent] = useState<Billing | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSupabase().auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      const user = data.session?.user;
      const billing = user ? await loadBilling(user.id) : { plan: "free" as const, interval: null };
      const passed = localStorage.getItem(FREE_PASS) === "1";
      if (!stay && (billing.plan === "pro" || passed)) {
        router.replace(next);
        return;
      }
      setSignedIn(!!user);
      setCurrent(billing);
    });
    return () => {
      cancelled = true;
    };
  }, [next, router, stay]);

  return (
    <>
      <SiteHeader cta={false} />
      <main className="shell plan-page">
        <div className="kicker">PAYWALL</div>
        <h1 className="page-title">Pick Free or Pro to continue.</h1>
        <p className="lede page-lede">Free is $0. Pro is $12 a month, or $79 for the year. The lessons stay available either way.</p>
        {current ? (
          <PlanChoices next={next} signedIn={signedIn} current={current} />
        ) : (
          <p className="lede">Loading plans…</p>
        )}
      </main>
    </>
  );
}

export default function PaywallPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader cta={false} />
          <main className="shell">
            <p className="lede">Loading plans…</p>
          </main>
        </>
      }
    >
      <Paywall />
    </Suspense>
  );
}
