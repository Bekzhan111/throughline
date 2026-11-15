import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Accounts are not configured." }, { status: 500 });

  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email.includes("@") || password.length < 6) {
    return NextResponse.json({ error: "Use an email and a password of at least 6 characters." }, { status: 400 });
  }

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { error: exists ? "That email already has an account. Sign in instead." : "Could not create the account." },
      { status: exists ? 409 : 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
