"use client";

import SiteHeader from "@/components/SiteHeader";
import Stars from "@/components/Stars";
import { firstWithoutStar, XP } from "@/lib/course";
import { loadPlan, type Plan, type PlanMine } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase";
import { ArrowLeft, BookOpen, Check, CircleCheck, Clock, FileText, Lock, Play, Star, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

const SHIFT = [0, 30, 52, 30];

export default function PlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [mine, setMine] = useState<PlanMine | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace(`/login?mode=in&next=/plan/${params.id}`);
        return;
      }
      try {
        const loaded = await loadPlan(params.id);
        if (!loaded) {
          setError("That plan is not on this account.");
          return;
        }
        setPlan(loaded.plan);
        setMine(loaded.mine);
      } catch {
        setError("We could not load this plan. Check your connection and reload the page.");
      }
    });
  }, [params.id, router]);

  if (error || !plan || !mine) {
    return (
      <>
        <SiteHeader cta={false} />
        <main className="shell">
          <p className="lede">{error || "Loading your plan…"}</p>
          {error && (
            <Link className="back" href="/programs" style={{ marginTop: 16 }}>
              <ArrowLeft size={18} aria-hidden />
              Back to programs
            </Link>
          )}
        </main>
      </>
    );
  }

  const best: Record<string, number> = {};
  for (const attempt of mine.attempts) best[attempt.lesson_id] = Math.max(best[attempt.lesson_id] ?? 0, attempt.score);
  const passed = new Set(plan.lessons.filter((lesson) => (best[lesson.id] ?? 0) >= 1).map((lesson) => lesson.id));
  const stars = Object.values(best).reduce((sum, score) => sum + score, 0);
  const maxStars = plan.lessons.reduce((sum, lesson) => sum + lesson.checks.length, 0);
  const done = passed.size;
  const xp = done * XP.lesson + stars * XP.correct + Object.keys(mine.actions).length * XP.action;
  const current = firstWithoutStar(plan.lessons, (lesson) => best[lesson.id] ?? 0);
  const minutes = plan.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

  return (
    <>
      <SiteHeader cta={false} />
      <main className="shell">
        <div className="program-grid">
          <div className="program-main">
            <div>
              <Link className="back" href="/programs">
                <ArrowLeft size={18} aria-hidden />
                Programs
              </Link>
              <div className="kicker" style={{ marginTop: 14 }}>
                FROM YOUR DOCUMENT
              </div>
              <h1 className="page-title">{plan.title}</h1>
              <p className="lede page-lede">{plan.goal}</p>
            </div>

            <div className="stat-tiles">
              <div className="stat-tile tone-green">
                <span className="tile">
                  <CircleCheck size={22} aria-hidden />
                </span>
                <div>
                  <strong>
                    {done}/{plan.lessons.length}
                  </strong>
                  <span>lessons done</span>
                </div>
              </div>
              <div className="stat-tile tone-blue">
                <span className="tile">
                  <Star size={22} aria-hidden />
                </span>
                <div>
                  <strong>
                    {stars}/{maxStars}
                  </strong>
                  <span>stars</span>
                </div>
              </div>
              <div className="stat-tile tone-gold">
                <span className="tile">
                  <Zap size={22} aria-hidden />
                </span>
                <div>
                  <strong>{xp}</strong>
                  <span>XP from this plan</span>
                </div>
              </div>
              <div className="stat-tile tone-purple">
                <span className="tile">
                  <Clock size={22} aria-hidden />
                </span>
                <div>
                  <strong>{minutes}</strong>
                  <span>minutes in the plan</span>
                </div>
              </div>
            </div>

            {current ? (
              <section className="today tone-purple">
                <div className="today-copy">
                  <div className="kicker">NEXT · LESSON {current.position}</div>
                  <h2>{current.title}</h2>
                  <p>{current.summary}</p>
                  <div className="today-meta">
                    <span>
                      <Clock size={16} aria-hidden />
                      {current.minutes} min
                    </span>
                    <span>
                      <BookOpen size={16} aria-hidden />
                      {current.paragraphs[0]?.source}
                    </span>
                  </div>
                  <Link className="btn white" href={`/plan/${plan.id}/lesson/${current.position}`}>
                    <Play size={18} aria-hidden />
                    Start lesson
                  </Link>
                </div>
                <BookOpen className="today-art" aria-hidden />
              </section>
            ) : (
              <section className="today tone-gold">
                <div className="today-copy">
                  <div className="kicker">PLAN COMPLETE</div>
                  <h2>You finished all {plan.lessons.length} lessons.</h2>
                  <p>Open any lesson below to read it again or win back a missing star.</p>
                </div>
              </section>
            )}

            <section className="unit tone-purple">
              <div className="unit-banner">
                <span className="unit-icon">
                  <FileText size={24} aria-hidden />
                </span>
                <div className="grow">
                  <div className="kicker">YOUR PLAN</div>
                  <h2>{plan.sourceName}</h2>
                </div>
                <span className="unit-count">
                  {done}/{plan.lessons.length}
                </span>
              </div>
              <div className="path">
                {plan.lessons.map((lesson, index) => {
                  const isDone = passed.has(lesson.id);
                  const isCurrent = lesson.id === current?.id;
                  const locked = !isDone && !isCurrent;
                  const shift = { "--shift": `${SHIFT[index % SHIFT.length]}px` } as CSSProperties;
                  const body = (
                    <>
                      <span className="node">
                        {isDone ? <Check size={30} strokeWidth={3.5} aria-hidden /> : isCurrent ? <Play size={26} aria-hidden /> : locked ? <Lock size={22} aria-hidden /> : lesson.position}
                      </span>
                      <span className="step-body">
                        {isCurrent && <span className="start-tag">Start here</span>}
                        <span className="step-title">
                          <span className="step-day">Lesson {lesson.position}</span> {lesson.title}
                        </span>
                        {isDone ? (
                          <Stars count={best[lesson.id] ?? 0} total={lesson.checks.length} />
                        ) : (
                          <span className="step-meta">
                            {locked ? "Earn a star on the lesson before this" : `${lesson.minutes} min · ${lesson.paragraphs[0]?.source}`}
                          </span>
                        )}
                      </span>
                    </>
                  );
                  return locked ? (
                    <div key={lesson.id} className="step locked" aria-disabled="true" style={shift}>
                      {body}
                    </div>
                  ) : (
                    <Link key={lesson.id} href={`/plan/${plan.id}/lesson/${lesson.position}`} className={`step ${isDone ? "done" : "current"}`} style={shift}>
                      {body}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="program-side">
            <section className="card">
              <div className="card-title">
                <span className="tile tone-purple">
                  <Target size={18} aria-hidden />
                </span>
                <h2>Your goal</h2>
              </div>
              <p className="action-text">{plan.goal}</p>
            </section>
            <section className="card">
              <div className="card-title">
                <span className="tile tone-blue">
                  <BookOpen size={18} aria-hidden />
                </span>
                <h2>What this plan covers</h2>
              </div>
              <p className="action-text">{plan.summary}</p>
              <p className="hint" style={{ marginTop: 10 }}>
                Saved from {plan.sourceName}. The file itself is not stored.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
