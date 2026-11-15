"use client";

import SiteHeader from "@/components/SiteHeader";
import { dollars, loadBilling, PRICES, type Billing } from "@/lib/billing";
import { computeStats, loadCourse, loadMine, type Course, type Mine } from "@/lib/course";
import { loadPlanCards, type PlanCard } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase";
import { ArrowRight, BookOpen, CircleCheck, FileText, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Card = {
  key: string;
  href: string;
  tone: string;
  kind: string;
  title: string;
  detail: string;
  done: number;
  total: number;
  stars: number;
  maxStars: number;
};

function place(done: number, total: number) {
  if (total > 0 && done >= total) return "Finished";
  if (done > 0) return "In progress";
  return "Not started";
}

export default function ProgramsPage() {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace("/login?mode=in&next=/programs");
        return;
      }
      try {
        const [loaded, progress, cards, plan] = await Promise.all([
          loadCourse(),
          loadMine(user.id),
          loadPlanCards(user.id),
          loadBilling(user.id),
        ]);
        setCourse(loaded);
        setMine(progress);
        setPlans(cards);
        setBilling(plan);
      } catch {
        setError("We could not load your programs. Check your connection and reload the page.");
      }
    });
  }, [router]);

  if (error || !course || !mine) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">{error || "Loading your programs…"}</p>
        </main>
      </>
    );
  }

  const stats = computeStats(mine);
  const maxStars = Object.values(course.checks).reduce((sum, list) => sum + list.length, 0);
  const finance: Card = {
    key: "finance",
    href: "/program",
    tone: "blue",
    kind: "Personal finance",
    title: "From paycheck to plan",
    detail: "21 days · 8 books",
    done: course.lessons.filter((lesson) => (stats.best[lesson.day] ?? 0) >= 1).length,
    total: course.lessons.length,
    stars: stats.stars,
    maxStars,
  };
  const documents: Card[] = plans.map((plan) => ({
    key: plan.id,
    href: `/plan/${plan.id}`,
    tone: "purple",
    kind: plan.goal,
    title: plan.title,
    detail: plan.sourceName,
    done: plan.done,
    total: plan.total,
    stars: plan.stars,
    maxStars: plan.maxStars,
  }));
  const groups = ["In progress", "Not started", "Finished"]
    .map((label) => ({
      label,
      items: [finance, ...documents].filter((item) => place(item.done, item.total) === label),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <div className="programs-head">
          <div>
            <div className="kicker">YOUR PROGRAMS</div>
            <h1 className="page-title">What you are learning</h1>
          </div>
          <Link className="btn primary" href="/plan/new">
            <Plus size={18} aria-hidden />
            Add a program
          </Link>
        </div>
        {billing?.plan === "free" && (
          <Link className="plan-banner" href="/paywall?next=/programs&stay=1">
            <span>
              <strong>You are on Free</strong>
              <span>
                Pro is {dollars(PRICES.month)} a month, or {dollars(PRICES.year)} a year.
              </span>
            </span>
            <span className="btn primary small">See plans</span>
          </Link>
        )}

        {groups.map((group) => (
          <section key={group.label} className="program-group">
            <h2>{group.label}</h2>
            <div className="program-list">
              {group.items.map((item) => {
                const width = item.total ? Math.round((item.done / item.total) * 100) : 0;
                const Icon = item.key === "finance" ? BookOpen : FileText;
                return (
                  <Link key={item.key} href={item.href} className={`program-card tone-${item.tone}`}>
                    <span className="tile big">
                      <Icon size={26} aria-hidden />
                    </span>
                    <span className="program-card-copy">
                      <span className="program-kind">{item.kind}</span>
                      <span className="program-name">{item.title}</span>
                      <span className="program-detail">{item.detail}</span>
                      <span className="track" aria-hidden>
                        <span style={{ width: `${width}%` }} />
                      </span>
                      <span className="program-meta">
                        <span>
                          <CircleCheck size={15} aria-hidden />
                          {item.done} of {item.total} lessons
                        </span>
                        <span>
                          <Star size={15} aria-hidden />
                          {item.stars} of {item.maxStars} stars
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="program-go" size={20} aria-hidden />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
