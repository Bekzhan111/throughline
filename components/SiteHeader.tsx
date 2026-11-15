"use client";

import { loadBilling, type Billing } from "@/lib/billing";
import { loadMine, PROGRESS_EVENT, type Stats } from "@/lib/course";
import { loadPlanActivity, mergeStats } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase";
import { Flame, Library, LogOut, Map, Route, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Account = { id: string; email: string };

export default function SiteHeader({ cta = true }: { cta?: boolean }) {
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    const toAccount = (user?: { id: string; email?: string }) => (user ? { id: user.id, email: user.email ?? "" } : null);
    supabase.auth.getSession().then(({ data }) => setAccount(toAccount(data.session?.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAccount(toAccount(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = account?.id;
  useEffect(() => {
    if (!userId) {
      setStats(null);
      setBilling(null);
      return;
    }
    loadBilling(userId).then(setBilling).catch(() => setBilling({ plan: "free", interval: null }));
    let cancelled = false;
    const refresh = () => {
      Promise.all([loadMine(userId), loadPlanActivity(userId)])
        .then(([mine, plan]) => {
          if (!cancelled) setStats(mergeStats(mine, plan));
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(PROGRESS_EVENT, refresh);
    };
  }, [userId]);

  async function signOut() {
    await getSupabase().auth.signOut();
    window.location.href = "/";
  }

  const current = (href: string) => (pathname === href ? "page" : undefined);
  const learning = pathname === "/programs" || pathname === "/program" || pathname.startsWith("/plan");
  const focused =
    pathname.startsWith("/lesson") ||
    pathname.startsWith("/tutor") ||
    pathname.includes("/lesson/") ||
    pathname.includes("/tutor/") ||
    pathname === "/pricing" ||
    pathname === "/paywall" ||
    pathname === "/checkout";

  return (
    <>
      <header className={account ? "site-header signed-in" : "site-header"}>
        <Link href={account ? "/programs" : "/"} className="brand" aria-label="Throughline home">
          <span className="brand-mark">
            <Route size={20} strokeWidth={2.75} aria-hidden />
          </span>
          <span className="brand-name">Throughline</span>
        </Link>
        <nav className="site-nav">
          {account && (
            <>
              <Link className="nav-link desk" href="/programs" aria-current={learning ? "page" : undefined}>
                <Map size={18} aria-hidden />
                Learn
              </Link>
              <Link className="nav-link desk" href="/library" aria-current={current("/library")}>
                <Library size={18} aria-hidden />
                Library
              </Link>
              {billing && (
                <Link className={`plan-pill${billing.plan === "pro" ? " pro" : ""}`} href="/pricing" aria-current={current("/pricing")}>
                  {billing.plan === "pro" ? "Pro" : "Free"}
                </Link>
              )}
              <span className="stat-pill streak" title="Day streak" aria-label={`${stats?.streak ?? 0} day streak`}>
                <Flame size={18} aria-hidden />
                {stats?.streak ?? 0}
              </span>
              <span className="stat-pill xp" title="Experience points" aria-label={`${stats?.xp ?? 0} XP`}>
                <Zap size={18} aria-hidden />
                {stats?.xp ?? 0}
              </span>
              <span className="who" title={account.email}>
                {account.email}
              </span>
              <button className="signout" onClick={signOut}>
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </>
          )}
          {account === null && (
            <>
              <a className="nav-link desk" href="/#how">
                How it works
              </a>
              <Link className="nav-link desk" href="/pricing" aria-current={current("/pricing")}>
                Pricing
              </Link>
              <Link className="nav-link desk" href="/library" aria-current={current("/library")}>
                Library
              </Link>
              {pathname !== "/login" && (
                <Link className="nav-link" href="/login?mode=in">
                  Sign in
                </Link>
              )}
              {cta && (
                <Link className="btn primary small" href="/start">
                  Start
                </Link>
              )}
            </>
          )}
        </nav>
      </header>
      {account && !focused && (
        <nav className="tabbar" aria-label="Sections">
          <Link href="/programs" aria-current={learning ? "page" : undefined}>
            <Map size={22} aria-hidden />
            Learn
          </Link>
          <Link href="/library" aria-current={current("/library")}>
            <Library size={22} aria-hidden />
            Library
          </Link>
        </nav>
      )}
    </>
  );
}
