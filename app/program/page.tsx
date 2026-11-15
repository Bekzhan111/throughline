"use client";

import SiteHeader from "@/components/SiteHeader";
import Stars from "@/components/Stars";
import { computeStats, firstWithoutStar, lessonIdeaIds, loadCourse, loadMine, shortAuthor, type Course, type Lesson, type Mine } from "@/lib/course";
import { getSupabase } from "@/lib/supabase";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Clock,
  Flame,
  Hammer,
  Library,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Star,
  Target,
  Telescope,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

const UNITS = [
  { tone: "green", Icon: Lightbulb },
  { tone: "blue", Icon: Hammer },
  { tone: "purple", Icon: Telescope },
];

const SHIFT = [0, 30, 52, 30];

export default function ProgramPage() {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace("/login?mode=in&next=/program");
        return;
      }
      try {
        const [loaded, progress] = await Promise.all([loadCourse(), loadMine(user.id)]);
        setCourse(loaded);
        setMine(progress);
      } catch {
        setError("We could not load your program. Check your connection and reload the page.");
      }
    });
  }, [router]);

  if (error || !course || !mine) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">{error || "Loading your program…"}</p>
        </main>
      </>
    );
  }

  const total = course.lessons.length;
  const stats = computeStats(mine);
  const passed = new Set(course.lessons.filter((lesson) => (stats.best[lesson.day] ?? 0) >= 1).map((lesson) => lesson.day));
  const current = firstWithoutStar(course.lessons, (lesson) => stats.best[lesson.day] ?? 0);
  const done = passed.size;
  const maxStars = Object.values(course.checks).reduce((sum, list) => sum + list.length, 0);
  const reviews = course.lessons.filter(
    (lesson) => stats.best[lesson.day] !== undefined && stats.best[lesson.day] < (course.checks[lesson.day]?.length ?? 0),
  );
  const lastActionDay = Object.keys(mine.actions)
    .map(Number)
    .sort((a, b) => b - a)[0];

  const counts: Record<string, number> = {};
  for (const lesson of course.lessons) {
    const titles = new Set(lessonIdeaIds(lesson).map((id) => course.ideas[id]?.book).filter(Boolean));
    for (const title of titles) counts[title] = (counts[title] || 0) + 1;
  }

  const sourcesOf = (lesson: Lesson) =>
    lessonIdeaIds(lesson)
      .slice(0, 2)
      .map((id) => course.ideas[id])
      .filter(Boolean)
      .map((idea) => `${shortAuthor(idea.author)} ch. ${idea.chapter}`)
      .join(" · ");

  const weeks = [...new Set(course.lessons.map((lesson) => lesson.week))];

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <div className="program-grid">
          <div className="program-main">
            <div>
              <div className="kicker">PERSONAL FINANCE · 21 DAYS</div>
              <h1 className="page-title">From paycheck to plan</h1>
            </div>

            <div className="stat-tiles">
              <div className="stat-tile tone-orange">
                <span className="tile">
                  <Flame size={22} aria-hidden />
                </span>
                <div>
                  <strong>{stats.streak}</strong>
                  <span>day streak</span>
                </div>
              </div>
              <div className="stat-tile tone-gold">
                <span className="tile">
                  <Zap size={22} aria-hidden />
                </span>
                <div>
                  <strong>{stats.xp}</strong>
                  <span>XP earned</span>
                </div>
              </div>
              <div className="stat-tile tone-green">
                <span className="tile">
                  <CircleCheck size={22} aria-hidden />
                </span>
                <div>
                  <strong>
                    {done}/{total}
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
                    {stats.stars}/{maxStars}
                  </strong>
                  <span>stars</span>
                </div>
              </div>
            </div>

            {current ? (
              <section className="today tone-blue">
                <div className="today-copy">
                  <div className="kicker">TODAY · DAY {current.day}</div>
                  <h2>{current.title}</h2>
                  <p>{current.summary}</p>
                  <div className="today-meta">
                    <span>
                      <Clock size={16} aria-hidden />
                      {current.minutes} min
                    </span>
                    <span>
                      <BookOpen size={16} aria-hidden />
                      {sourcesOf(current)}
                    </span>
                  </div>
                  <Link className="btn white" href={`/lesson/${current.day}`}>
                    <Play size={18} aria-hidden />
                    Start lesson
                  </Link>
                </div>
                <BookOpen className="today-art" aria-hidden />
              </section>
            ) : (
              <section className="today tone-gold">
                <div className="today-copy">
                  <div className="kicker">PROGRAM COMPLETE</div>
                  <h2>You finished all {total} days.</h2>
                  <p>Open any lesson below to read it again or win back a missing star.</p>
                </div>
                <Trophy className="today-art" aria-hidden />
              </section>
            )}

            {weeks.map((week, unitIndex) => {
              const unit = UNITS[unitIndex % UNITS.length];
              const weekLessons = course.lessons.filter((lesson) => lesson.week === week);
              const weekDone = weekLessons.filter((lesson) => passed.has(lesson.day)).length;
              return (
                <section key={week} className={`unit tone-${unit.tone}`}>
                  <div className="unit-banner">
                    <span className="unit-icon">
                      <unit.Icon size={24} aria-hidden />
                    </span>
                    <div className="grow">
                      <div className="kicker">WEEK {week}</div>
                      <h2>{weekLessons[0]?.weekTitle}</h2>
                    </div>
                    <span className="unit-count">
                      {weekDone}/{weekLessons.length}
                    </span>
                  </div>
                  <div className="path">
                    {weekLessons.map((lesson, index) => {
                      const isDone = passed.has(lesson.day);
                      const isCurrent = lesson.day === current?.day;
                      const locked = !isDone && !isCurrent;
                      const shift = { "--shift": `${SHIFT[index % SHIFT.length]}px` } as CSSProperties;
                      const body = (
                        <>
                          <span className="node">
                            {isDone ? <Check size={30} strokeWidth={3.5} aria-hidden /> : isCurrent ? <Play size={26} aria-hidden /> : locked ? <Lock size={22} aria-hidden /> : lesson.day}
                          </span>
                          <span className="step-body">
                            {isCurrent && <span className="start-tag">Start here</span>}
                            <span className="step-title">
                              <span className="step-day">Day {lesson.day}</span> {lesson.title}
                            </span>
                            {isDone ? (
                              <Stars count={stats.best[lesson.day] ?? 0} total={course.checks[lesson.day]?.length ?? 3} />
                            ) : (
                              <span className="step-meta">
                                {locked ? "Earn a star on the lesson before this" : `${lesson.minutes} min · ${sourcesOf(lesson)}`}
                              </span>
                            )}
                          </span>
                        </>
                      );
                      return locked ? (
                        <div key={lesson.day} className="step locked" aria-disabled="true" style={shift}>
                          {body}
                        </div>
                      ) : (
                        <Link key={lesson.day} href={`/lesson/${lesson.day}`} className={`step ${isDone ? "done" : "current"}`} style={shift}>
                          {body}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="program-side">
            <section className="card">
              <div className="card-title">
                <span className="tile tone-purple">
                  <Target size={18} aria-hidden />
                </span>
                <h2>Your programs</h2>
              </div>
              <p className="book-sub">This course, plus every program built from a document you uploaded.</p>
              <Link className="btn ghost small block" href="/programs">
                See all programs
              </Link>
            </section>
            {reviews.length > 0 && (
              <section className="card">
                <div className="card-title">
                  <span className="tile tone-orange">
                    <RotateCcw size={18} aria-hidden />
                  </span>
                  <h2>Win back your stars</h2>
                </div>
                {reviews.map((lesson) => (
                  <Link key={lesson.day} href={`/lesson/${lesson.day}#check`} className="side-row">
                    <div className="grow">
                      <div className="side-row-title">
                        Day {lesson.day} · {lesson.title}
                      </div>
                      <Stars count={stats.best[lesson.day] ?? 0} total={course.checks[lesson.day]?.length ?? 3} size={14} />
                    </div>
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                ))}
              </section>
            )}

            {lastActionDay !== undefined && (
              <section className="card">
                <div className="card-title">
                  <span className="tile tone-purple">
                    <Target size={18} aria-hidden />
                  </span>
                  <h2>Your action from day {lastActionDay}</h2>
                </div>
                <p className="action-text">{mine.actions[lastActionDay]}</p>
              </section>
            )}

            <section className="card">
              <div className="card-title">
                <span className="tile tone-blue">
                  <Library size={18} aria-hidden />
                </span>
                <h2>Books in this program</h2>
              </div>
              {course.books.map((book) => (
                <div key={book.slug} className="book-row">
                  <div className="cover" style={{ background: book.color }} />
                  <div>
                    <div className="book-title">{book.title}</div>
                    <div className="book-sub">
                      {book.author} · used in {counts[book.title] || 0} lessons
                    </div>
                  </div>
                </div>
              ))}
              <Link className="btn ghost small block" href="/library">
                Open library
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
