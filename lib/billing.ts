import { getSupabase } from "@/lib/supabase";

export const PRICES = { month: 12, year: 79 } as const;

export type PlanInterval = keyof typeof PRICES;
export type Billing = { plan: "free" | "pro"; interval: PlanInterval | null };

export const FREE_PASS = "throughline.free-pass";

export function dollars(amount: number) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function yearMonthly() {
  return Math.round((PRICES.year / 12) * 100) / 100;
}

export function yearSavings() {
  return PRICES.month * 12 - PRICES.year;
}

export function intervalLabel(interval: PlanInterval) {
  return interval === "year" ? "year" : "month";
}

export function priceLine(interval: PlanInterval) {
  if (interval === "year") return `${dollars(PRICES.year)} a year`;
  return `${dollars(PRICES.month)} a month`;
}

export function safeNext(value: string | null, fallback = "/programs") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/checkout") || value.startsWith("/paywall") || value.startsWith("/pricing")) {
    return fallback;
  }
  return value;
}

export function gateHref(target: string) {
  return `/paywall?next=${encodeURIComponent(target)}`;
}

export function checkoutHref(interval: PlanInterval, next: string, signedIn: boolean) {
  const dest = `/checkout?interval=${interval}&next=${encodeURIComponent(next)}`;
  if (signedIn) return dest;
  return `/login?mode=up&next=${encodeURIComponent(dest)}`;
}

export async function loadBilling(userId: string): Promise<Billing> {
  const { data, error } = await getSupabase().from("billing").select("plan, billing_interval").eq("user_id", userId).maybeSingle();
  if (error || !data || data.plan !== "pro") return { plan: "free", interval: null };
  return { plan: "pro", interval: data.billing_interval === "year" ? "year" : "month" };
}
