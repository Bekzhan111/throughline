"use client";

import { checkoutHref, dollars, FREE_PASS, priceLine, PRICES, yearMonthly, yearSavings, type Billing, type PlanInterval } from "@/lib/billing";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const freePoints = ["The finance program", "A program from a file you upload", "Lessons, stars, and the voice tutor"];

export default function PlanChoices({ next, signedIn, current }: { next: string; signedIn: boolean; current: Billing }) {
  const router = useRouter();
  const pro = current.plan === "pro";

  function continueFree() {
    localStorage.setItem(FREE_PASS, "1");
    router.push(next);
  }

  return (
    <div className="plan-grid">
      <article className="plan-card">
        <div className="kicker">FREE</div>
        <div className="plan-price">
          $0 <span>forever</span>
        </div>
        <ul>
          {freePoints.map((point) => (
            <li key={point}>
              <Check size={16} aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        {pro ? (
          <Link className="btn ghost block" href={next}>
            Back to learning
          </Link>
        ) : signedIn ? (
          <button className="btn ghost block" type="button" onClick={continueFree}>
            Continue free
          </button>
        ) : (
          <Link className="btn ghost block" href="/start">
            Start free
          </Link>
        )}
      </article>

      <article className="plan-card featured">
        <div className="kicker">PRO</div>
        <div className="plan-price-stack">
          <div className="plan-price">
            {dollars(PRICES.month)} <span>a month</span>
          </div>
          <div className="plan-or">or</div>
          <div className="plan-price">
            {dollars(PRICES.year)} <span>a year</span>
          </div>
        </div>
        <p className="plan-note">
          The yearly plan is {dollars(yearMonthly())} a month, billed once as {dollars(PRICES.year)}. That is {dollars(yearSavings())} less than paying monthly.
          Lessons stay open on Free and Pro.
        </p>
        <div className="plan-actions">
          <ProButton interval="month" next={next} signedIn={signedIn} current={current} />
          <ProButton interval="year" next={next} signedIn={signedIn} current={current} />
        </div>
      </article>
    </div>
  );
}

function ProButton({
  interval,
  next,
  signedIn,
  current,
}: {
  interval: PlanInterval;
  next: string;
  signedIn: boolean;
  current: Billing;
}) {
  const currentInterval = current.plan === "pro" && current.interval === interval;
  if (currentInterval) {
    return (
      <button className="btn ghost block" type="button" disabled>
        Current plan · {priceLine(interval)}
      </button>
    );
  }
  return (
    <Link className={`btn block ${interval === "year" ? "purple" : "primary"}`} href={checkoutHref(interval, next, signedIn)}>
      {interval === "year" ? `Pay ${dollars(PRICES.year)} yearly` : `Pay ${dollars(PRICES.month)} monthly`}
    </Link>
  );
}
