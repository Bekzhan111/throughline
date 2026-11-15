import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browser: SupabaseClient | null = null;

function ensureWebSocket() {
  if (typeof globalThis.WebSocket !== "undefined") return;
  class StubSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    readyState = 3;
    constructor(public url: string) {}
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.WebSocket = StubSocket as unknown as typeof WebSocket;
}

export function getSupabaseFor(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase URL or publishable key is missing");
  ensureWebSocket();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase URL or publishable key is missing");
  ensureWebSocket();
  if (typeof window === "undefined") {
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  if (!browser) {
    browser = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return browser;
}
