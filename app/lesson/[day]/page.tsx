"use client";

import SiteHeader from "@/components/SiteHeader";
import { gateHref } from "@/lib/billing";
import SourceList from "@/components/SourceList";
import Stars from "@/components/Stars";
import {
  completeLesson,
  firstWithoutStar,
  lessonIdeaIds,
  loadCourse,
  loadMine,
  PROGRESS_EVENT,
  saveAttempt,
  shortAuthor,
  XP,
  type Course,
} from "@/lib/course";
import { getSupabase } from "@/lib/supabase";
import { canSpeak, speakSequence } from "@/lib/voice";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Lightbulb,
  ListChecks,
  Mic,
  RotateCcw,
  Scale,
  Square,
  ThumbsUp,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Result = { score: number; total: number; gained: number; missed: { prompt: string; ideaId: string }[] };

const WEEK_TONES = ["green", "blue", "purple"];
const LETTERS = ["A", "B", "C", "D"];

function shuffled(count: number) {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function LessonScreen({ day }: { day: number }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [before, setBefore] = useState<{ completed: boolean; best: number | null }>({ completed: false, best: null });
  const [active, setActive] = useState(-1);
  const [openCite, setOpenCite] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [order, setOrder] = useState<number[][]>([]);
  const [picks, setPicks] = useState<(number | undefined)[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const keepAlive = useRef<number | null>(null);
  const playId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getSupabase().auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace(`/login?mode=in&next=/lesson/${day}`);
        return;
      }
      try {
        const [loaded, mine] = await Promise.all([loadCourse(), loadMine(user.id)]);
        if (cancelled) return;
        const best: Record<number, number> = {};
        for (const attempt of mine.attempts) best[attempt.lesson_day] = Math.max(best[attempt.lesson_day] ?? 0, attempt.score);
        const open = firstWithoutStar(loaded.lessons, (item) => best[item.day] ?? 0);
        if (open && day > open.day) {
          router.replace(`/lesson/${open.day}`);
          return;
        }
        const scores = mine.attempts.filter((item) => item.lesson_day === day).map((item) => item.score);
        setUserId(user.id);
        setBefore({ completed: mine.completed.includes(day), best: scores.length ? Math.max(...scores) : null });
        setOrder((loaded.checks[day] || []).map((check) => shuffled(check.choices.length)));
        setCourse(loaded);
      } catch {
        if (!cancelled) setError("We could not load this lesson. Check your connection and reload the page.");
      }
    });
    return () => {
      cancelled = true;
      playId.current += 1;
      if (keepAlive.current) window.clearInterval(keepAlive.current);
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, [day, router]);

  useEffect(() => {
    if (course && window.location.hash === "#check") document.getElementById("check")?.scrollIntoView();
  }, [course]);

  const lesson = course?.lessons.find((item) => item.day === day);

  if (error || !course || !lesson) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">{error || (course ? "That day is not in the program." : "Loading the lesson…")}</p>
          {(error || course) && (
            <Link className="back" href="/program" style={{ marginTop: 16 }}>
              <ArrowLeft size={18} aria-hidden />
              Back to program
            </Link>
          )}
        </main>
      </>
    );
  }

  const checks = course.checks[day] || [];
  const total = course.lessons.length;
  const next = course.lessons.find((item) => item.day === day + 1);
  const allPicked = checks.every((_, index) => picks[index] !== undefined);
  const tone = WEEK_TONES[(lesson.week - 1) % WEEK_TONES.length];
  const sources = lessonIdeaIds(lesson)
    .map((id) => course.ideas[id])
    .filter(Boolean);

  function stopKeepAlive() {
    if (keepAlive.current) {
      window.clearInterval(keepAlive.current);
      keepAlive.current = null;
    }
  }

  function stop() {
    playId.current += 1;
    stopKeepAlive();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setActive(-1);
  }

  async function speak() {
    const id = ++playId.current;
    window.speechSynthesis.cancel();
    stopKeepAlive();
    setSpeaking(true);
    keepAlive.current = window.setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
    }, 10000);
    await speakSequence(
      lesson!.paragraphs.map((paragraph) => paragraph.text),
      {
        alive: () => id === playId.current,
        onPart: setActive,
        onDone: () => {
          if (id !== playId.current) return;
          stopKeepAlive();
          setSpeaking(false);
          setActive(-1);
        },
      },
    );
  }

  async function grade() {
    if (!allPicked || saving) return;
    const missed = checks.flatMap((check, index) =>
      picks[index] === check.answer ? [] : [{ prompt: check.prompt, ideaId: check.ideaId }],
    );
    const score = checks.length - missed.length;
    setSaving(true);
    setSaveError("");
    try {
      await saveAttempt(userId, day, score, checks.length, missed);
      const cleared = score >= 1;
      if (cleared) await completeLesson(userId, day);
      const gained = (cleared && !before.completed ? XP.lesson : 0) + Math.max(0, score - (before.best ?? 0)) * XP.correct;
      setResult({ score, total: checks.length, gained, missed });
      setBefore({ completed: before.completed || cleared, best: Math.max(before.best ?? 0, score) });
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    } catch {
      setSaveError("Your score was not saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function retake() {
    setResult(null);
    setPicks([]);
    setOrder(checks.map((check) => shuffled(check.choices.length)));
    document.getElementById("check")?.scrollIntoView();
  }

  const verdict = !result
    ? null
    : result.score === result.total
      ? { tone: "green", Icon: Trophy, title: "Perfect score!" }
      : result.score >= result.total - 1
        ? { tone: "blue", Icon: ThumbsUp, title: "Nice work!" }
        : { tone: "orange", Icon: RotateCcw, title: "Good try. Read it once more." };

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <div className="lesson-top">
          <Link className="back" href="/program">
            <ArrowLeft size={18} aria-hidden />
            Program
          </Link>
          <ol className="stepper" aria-label="Steps in this lesson">
            <li className={result ? "done" : "now"}>
              <BookOpen size={16} aria-hidden />
              Read
            </li>
            <li className={result ? "done" : ""}>
              <a href="#check">
                <ListChecks size={16} aria-hidden />
                Check
              </a>
            </li>
            <li className={result ? "now" : ""}>
              <Mic size={16} aria-hidden />
              Talk
            </li>
          </ol>
        </div>

        <div className="lesson-grid">
          <div className="lesson-main">
            <div className={`lesson-head tone-${tone}`}>
              <div className="chips">
                <span className="tag">Day {lesson.day} of {total}</span>
                <span className="tag plain">
                  <Clock size={14} aria-hidden />
                  {lesson.minutes} min
                </span>
              </div>
              <h1 className="page-title">{lesson.title}</h1>
              <p className="lede page-lede">{lesson.summary}</p>
              {canSpeak() && (
                <button className="btn ghost listen" onClick={speaking ? stop : speak}>
                  {speaking ? <Square size={16} aria-hidden /> : <Volume2 size={18} aria-hidden />}
                  {speaking ? "Stop audio" : "Listen to this lesson"}
                </button>
              )}
            </div>

            <article>
              {lesson.paragraphs.map((paragraph, index) => {
                const openId = openCite?.startsWith(`${index}:`) ? openCite.slice(String(index).length + 1) : null;
                const open = openId ? course.ideas[openId] : null;
                return (
                  <div key={index} className={`para-block${active === index && speaking ? " active" : ""}`}>
                    <p className="para">{paragraph.text}</p>
                    <div className="cites">
                      {paragraph.cites.map((id) => {
                        const idea = course.ideas[id];
                        if (!idea) return null;
                        const key = `${index}:${id}`;
                        return (
                          <button
                            key={id}
                            className="citebtn"
                            aria-expanded={openCite === key}
                            onClick={() => setOpenCite(openCite === key ? null : key)}
                          >
                            <span className="dot" style={{ background: idea.color }} />
                            {shortAuthor(idea.author)} · ch. {idea.chapter}
                          </button>
                        );
                      })}
                    </div>
                    {open && (
                      <div className="source" style={{ borderColor: open.color }}>
                        <span className="cover" style={{ background: open.color }} />
                        <div>
                          <strong>{open.book}</strong>
                          <div className="source-meta">
                            {open.author} · Chapter {open.chapter}: {open.chapterTitle}
                          </div>
                          <div className="source-text">{open.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </article>

            {lesson.disagreement && (
              <section className="disagree">
                <div className="card-title">
                  <span className="tile tone-orange">
                    <Scale size={18} aria-hidden />
                  </span>
                  <h2>Where the books disagree</h2>
                </div>
                <div className="versus">
                  <div className="side-a">
                    <strong>{lesson.disagreement.a.author}</strong>
                    <p>{lesson.disagreement.a.text}</p>
                  </div>
                  <span className="vs" aria-hidden>
                    VS
                  </span>
                  <div className="side-b">
                    <strong>{lesson.disagreement.b.author}</strong>
                    <p>{lesson.disagreement.b.text}</p>
                  </div>
                </div>
                <div className="tie">
                  <Lightbulb size={18} aria-hidden />
                  <p>{lesson.disagreement.tie}</p>
                </div>
              </section>
            )}

            <section className="check" id="check">
              <div className="card-title">
                <span className="tile tone-green">
                  <ListChecks size={18} aria-hidden />
                </span>
                <div>
                  <h2>Three quick questions</h2>
                  <p className="hint">
                    Each right answer is a star. One star opens the next lesson.
                    {before.best !== null && !result ? ` Your best so far: ${before.best} of ${checks.length}.` : ""}
                  </p>
                </div>
              </div>

              {checks.map((check, index) => (
                <div key={check.prompt} className="question" role="group" aria-labelledby={`question-${index}`}>
                  <div id={`question-${index}`} className="question-title">
                    <span className="question-no">{index + 1}</span>
                    {check.prompt}
                  </div>
                  {(order[index] || []).map((choiceIndex, position) => {
                    const picked = picks[index] === choiceIndex;
                    const right = Boolean(result) && choiceIndex === check.answer;
                    const wrong = Boolean(result) && picked && choiceIndex !== check.answer;
                    return (
                      <label
                        key={choiceIndex}
                        className={`choice${picked && !result ? " picked" : ""}${right ? " right" : ""}${wrong ? " wrong" : ""}${result ? " locked" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={picked}
                          disabled={Boolean(result)}
                          onChange={() =>
                            setPicks((current) => {
                              const nextPicks = [...current];
                              nextPicks[index] = choiceIndex;
                              return nextPicks;
                            })
                          }
                        />
                        <span className="letter">
                          {right ? <Check size={16} strokeWidth={3.5} aria-hidden /> : wrong ? <X size={16} strokeWidth={3.5} aria-hidden /> : LETTERS[position]}
                        </span>
                        <span className="choice-text">{check.choices[choiceIndex]}</span>
                        {right && <em>Correct</em>}
                        {wrong && <em>Your answer</em>}
                      </label>
                    );
                  })}
                </div>
              ))}

              {!result && (
                <>
                  <button className="btn green big" disabled={saving || !allPicked} onClick={grade}>
                    <Check size={20} strokeWidth={3} aria-hidden />
                    {saving ? "Saving…" : "Check my answers"}
                  </button>
                  {!allPicked && <p className="hint">Answer all three to see your score.</p>}
                </>
              )}
              {saveError && <p className="form-error">{saveError}</p>}

              {result && verdict && (
                <div className={`result tone-${verdict.tone}`}>
                  <div className="result-banner">
                    <span className="result-icon">
                      <verdict.Icon size={30} aria-hidden />
                    </span>
                    <div>
                      <div className="result-title">{verdict.title}</div>
                      <div className="result-sub">
                        {result.score} of {result.total} correct
                        {result.score >= 1 ? ` · Day ${day} complete` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="result-body">
                    <div className="rewards">
                      <Stars count={result.score} total={result.total} size={34} />
                      {result.gained > 0 && (
                        <span className="xp-pill">
                          <Zap size={18} aria-hidden />+{result.gained} XP
                        </span>
                      )}
                    </div>
                    {result.missed.length > 0 && (
                      <>
                        <p className="missed-lead">The idea behind each one you missed:</p>
                        {result.missed.map((item) => {
                          const idea = course.ideas[item.ideaId];
                          return (
                            <div key={item.prompt} className="missed" style={{ borderColor: idea?.color }}>
                              <strong>{item.prompt}</strong>
                              {idea && (
                                <>
                                  <div>{idea.text}</div>
                                  <small>
                                    {idea.author}, {idea.book}, chapter {idea.chapter}
                                  </small>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                    <div className="result-actions">
                      <Link className="btn purple" href={`/tutor/${day}`}>
                        <Mic size={18} aria-hidden />
                        Talk it through
                      </Link>
                      {result.score >= 1 || !next ? (
                        <Link className="btn ghost" href={result.score >= 1 && next ? gateHref(`/lesson/${next.day}`) : "/program"}>
                          {result.score >= 1 && next ? "Next lesson" : "Back to program"}
                          <ArrowRight size={18} aria-hidden />
                        </Link>
                      ) : (
                        <p className="hint">Earn at least one star to open the next lesson.</p>
                      )}
                      <button className="textbtn" onClick={retake}>
                        <RotateCcw size={16} aria-hidden />
                        Retake
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="lesson-side">
            <SourceList title="Sources in this lesson" ideas={sources} />
          </aside>
        </div>

        {speaking && (
          <div className="playing">
            <Volume2 size={18} aria-hidden />
            <span>Reading aloud</span>
            <button onClick={stop}>
              <Square size={14} aria-hidden />
              Stop
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default function LessonPage() {
  const params = useParams<{ day: string }>();
  return <LessonScreen key={params.day} day={Number(params.day)} />;
}
