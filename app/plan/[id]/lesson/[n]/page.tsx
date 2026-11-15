"use client";

import SiteHeader from "@/components/SiteHeader";
import { gateHref } from "@/lib/billing";
import Stars from "@/components/Stars";
import { firstWithoutStar, PROGRESS_EVENT, XP } from "@/lib/course";
import { completePlanLesson, loadPlan, savePlanAttempt, type Plan, type PlanLesson } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase";
import { canSpeak, speakSequence } from "@/lib/voice";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, ListChecks, Mic, RotateCcw, Square, ThumbsUp, Trophy, Volume2, X, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Result = { score: number; total: number; gained: number; missed: { prompt: string; note: string; source: string }[] };
const LETTERS = ["A", "B", "C", "D"];

function shuffled(count: number) {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function LessonScreen({ planId, position }: { planId: string; position: number }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [lesson, setLesson] = useState<PlanLesson | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [before, setBefore] = useState<{ completed: boolean; best: number | null }>({ completed: false, best: null });
  const [active, setActive] = useState(-1);
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
        router.replace(`/login?mode=in&next=/plan/${planId}/lesson/${position}`);
        return;
      }
      try {
        const loaded = await loadPlan(planId);
        if (cancelled) return;
        const found = loaded?.plan.lessons.find((item) => item.position === position) || null;
        if (!loaded || !found) {
          setError(loaded ? "That lesson is not in this plan." : "That plan is not on this account.");
          setPlan(loaded?.plan || null);
          return;
        }
        const best: Record<string, number> = {};
        for (const attempt of loaded.mine.attempts) best[attempt.lesson_id] = Math.max(best[attempt.lesson_id] ?? 0, attempt.score);
        const open = firstWithoutStar(loaded.plan.lessons, (item) => best[item.id] ?? 0);
        if (open && position > open.position) {
          router.replace(`/plan/${planId}/lesson/${open.position}`);
          return;
        }
        const scores = loaded.mine.attempts.filter((item) => item.lesson_id === found.id).map((item) => item.score);
        setUserId(user.id);
        setPlan(loaded.plan);
        setLesson(found);
        setBefore({ completed: loaded.mine.completed.includes(found.id), best: scores.length ? Math.max(...scores) : null });
        setOrder(found.checks.map((check) => shuffled(check.choices.length)));
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
  }, [planId, position, router]);

  useEffect(() => {
    if (lesson && window.location.hash === "#check") document.getElementById("check")?.scrollIntoView();
  }, [lesson]);

  if (error || !plan || !lesson) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">{error || "Loading the lesson…"}</p>
          {(error || plan) && (
            <Link className="back" href={plan ? `/plan/${plan.id}` : "/program"} style={{ marginTop: 16 }}>
              <ArrowLeft size={18} aria-hidden />
              Back to the plan
            </Link>
          )}
        </main>
      </>
    );
  }

  const checks = lesson.checks;
  const next = plan.lessons.find((item) => item.position === position + 1);
  const allPicked = checks.every((_, index) => picks[index] !== undefined);
  const sources = [...new Set(lesson.paragraphs.map((paragraph) => paragraph.source))];

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
      picks[index] === check.answer ? [] : [{ prompt: check.prompt, note: check.note, source: check.source }],
    );
    const score = checks.length - missed.length;
    setSaving(true);
    setSaveError("");
    try {
      await savePlanAttempt(userId, lesson!.id, score, checks.length, missed);
      const cleared = score >= 1;
      if (cleared) await completePlanLesson(userId, lesson!.id);
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
          <Link className="back" href={`/plan/${plan.id}`}>
            <ArrowLeft size={18} aria-hidden />
            Plan
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
            <div className="lesson-head tone-purple">
              <div className="chips">
                <span className="tag">
                  Lesson {lesson.position} of {plan.lessons.length}
                </span>
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
              {lesson.paragraphs.map((paragraph, index) => (
                <div key={index} className={`para-block${active === index && speaking ? " active" : ""}`}>
                  <p className="para">{paragraph.text}</p>
                  <div className="cites">
                    <span className="citebtn">
                      <span className="dot" style={{ background: "#8b5cf6" }} />
                      {paragraph.source}
                    </span>
                  </div>
                </div>
              ))}
            </article>

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
                  {(order[index] || []).map((choiceIndex, spot) => {
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
                          {right ? <Check size={16} strokeWidth={3.5} aria-hidden /> : wrong ? <X size={16} strokeWidth={3.5} aria-hidden /> : LETTERS[spot]}
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
                        {result.score >= 1 ? ` · Lesson ${position} complete` : ""}
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
                        {result.missed.map((item) => (
                          <div key={item.prompt} className="missed" style={{ borderColor: "#8b5cf6" }}>
                            <strong>{item.prompt}</strong>
                            {item.note && <div>{item.note}</div>}
                            <small>{item.source} · {plan.sourceName}</small>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="result-actions">
                      <Link className="btn purple" href={`/plan/${plan.id}/tutor/${position}`}>
                        <Mic size={18} aria-hidden />
                        Talk it through
                      </Link>
                      {result.score >= 1 || !next ? (
                        <Link className="btn ghost" href={result.score >= 1 && next ? gateHref(`/plan/${plan.id}/lesson/${next.position}`) : `/plan/${plan.id}`}>
                          {result.score >= 1 && next ? "Next lesson" : "Back to the plan"}
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
            <section className="card source-list">
              <div className="card-title">
                <span className="tile tone-purple">
                  <BookOpen size={18} aria-hidden />
                </span>
                <h2>Where this lesson points</h2>
              </div>
              {sources.map((source) => (
                <div key={source} className="source-item">
                  <span className="cover" style={{ background: "#8b5cf6" }} />
                  <div>
                    <strong>{source}</strong>
                    <span>{plan.sourceName}</span>
                  </div>
                </div>
              ))}
            </section>
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

export default function PlanLessonPage() {
  const params = useParams<{ id: string; n: string }>();
  return <LessonScreen key={`${params.id}-${params.n}`} planId={params.id} position={Number(params.n)} />;
}
