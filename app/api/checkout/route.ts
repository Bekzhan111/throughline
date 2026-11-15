import { PRICES, type PlanInterval } from "@/lib/billing";
import { getSupabaseFor } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const TEST_CARD = "4242424242424242";

function expiryInFuture(exp: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(exp);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > new Date();
}

export async function POST(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in to pay." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { interval?: string; number?: string; exp?: string; cvc?: string } | null;
  const interval: PlanInterval | null = body?.interval === "year" || body?.interval === "month" ? body.interval : null;
  if (!interval) return NextResponse.json({ error: "Choose monthly or yearly." }, { status: 400 });

  const number = String(body?.number || "").replace(/\s/g, "");
  const exp = String(body?.exp || "").trim();
  const cvc = String(body?.cvc || "").trim();
  if (number !== TEST_CARD) {
    return NextResponse.json({ error: "In test mode, use card 4242 4242 4242 4242." }, { status: 400 });
  }
  if (!expiryInFuture(exp)) {
    return NextResponse.json({ error: "Enter an expiry in the future, like 12/28." }, { status: 400 });
  }
  if (!/^\d{3}$/.test(cvc)) {
    return NextResponse.json({ error: "Enter the 3-digit code." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Checkout is not configured." }, { status: 500 });

  const { data, error } = await getSupabaseFor(token).auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Sign in to pay." }, { status: 401 });

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: writeError } = await admin.from("billing").upsert(
    { user_id: data.user.id, plan: "pro", billing_interval: interval, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (writeError) return NextResponse.json({ error: "The plan did not save. Try again." }, { status: 500 });

  return NextResponse.json({ ok: true, plan: "pro", interval, amount: PRICES[interval] });
}
