"use client";

import PlanChoices from "@/components/PlanChoices";
import SiteHeader from "@/components/SiteHeader";
import { loadBilling, safeNext, type Billing } from "@/lib/billing";
import { getSupabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Pricing() {
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const [signedIn, setSignedIn] = useState(false);
  const [current, setCurrent] = useState<Billing | null>(null);

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      setSignedIn(!!user);
      setCurrent(user ? await loadBilling(user.id) : { plan: "free", interval: null });
    });
  }, []);

  return (
    <div className="landing">
      <SiteHeader />
      <main className="shell plan-page">
        <div className="kicker">PLANS</div>
        <h1 className="page-title">Free, or Pro.</h1>
        <p className="lede page-lede">Free is $0. Pro is $12 a month, or $79 for the year.</p>
        {current ? (
          <PlanChoices next={next} signedIn={signedIn} current={current} />
        ) : (
          <p className="lede">Loading plans…</p>
        )}
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="landing">
          <SiteHeader />
          <main className="shell">
            <p className="lede">Loading plans…</p>
          </main>
        </div>
      }
    >
      <Pricing />
    </Suspense>
  );
}
