"use client";

import SiteHeader from "@/components/SiteHeader";
import { gateHref } from "@/lib/billing";
import { firstWithoutStar, PROGRESS_EVENT, XP } from "@/lib/course";
import { loadPlan, savePlanAction, type Plan, type PlanLesson } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase";
import { canSpeak, makeUtterance } from "@/lib/voice";
import { ArrowLeft, ArrowRight, BookOpen, Mic, Send, Sparkles, Target, User, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Exchange = { question: string; answer: string; reply: string; cites: string[] };

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function TutorScreen({ planId, position }: { planId: string; position: number }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [lesson, setLesson] = useState<PlanLesson | null>(null);
  const [userId, setUserId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [action, setAction] = useState("");
  const [saved, setSaved] = useState(false);
  const [hadAction, setHadAction] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<Rec | null>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSupabase().auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace(`/login?mode=in&next=/plan/${planId}/tutor/${position}`);
        return;
      }
      try {
        const loaded = await loadPlan(planId);
        if (cancelled) return;
        const found = loaded?.plan.lessons.find((item) => item.position === position) || null;
        if (!loaded || !found) {
          setLoadError(loaded ? "That lesson is not in this plan." : "That plan is not on this account.");
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
        setUserId(user.id);
        setPlan(loaded.plan);
        setLesson(found);
        setHadAction(loaded.mine.actions[found.id] !== undefined);
        setCleared((best[found.id] ?? 0) >= 1);
      } catch {
        if (!cancelled) setLoadError("We could not load this check-in. Check your connection and reload the page.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [planId, position, router]);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event) => setDraft(event.results[0][0].transcript);
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setCanListen(true);
    }
    return () => {
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (exchanges.length) latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [exchanges.length]);

  if (loadError || !plan || !lesson) {
    return (
      <>
        <SiteHeader cta={false} />
        <main className="shell">
          <p className="lede">{loadError || "Loading the check-in…"}</p>
          {(loadError || plan) && (
            <Link className="back" href={plan ? `/plan/${plan.id}` : "/program"} style={{ marginTop: 16 }}>
              <ArrowLeft size={18} aria-hidden />
              Back to the plan
            </Link>
          )}
        </main>
      </>
    );
  }

  const step = exchanges.length;
  const total = lesson.questions.length;
  const done = step >= total;
  const question = lesson.questions[step];
  const next = plan.lessons.find((item) => item.position === position + 1);

  async function submit() {
    const answer = draft.trim();
    if (!answer || busy || done) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in first.");
      const response = await fetch("/api/plan-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId, position, question, answer, step: step + 1 }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "tutor failed");
      setExchanges((current) => [...current, { question, answer, reply: body.reply, cites: body.cites || [] }]);
      setDraft("");
      if (canSpeak()) {
        const utterance = await makeUtterance(body.reply);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      if (body.action) {
        setAction(body.action);
        try {
          await savePlanAction(userId, lesson!.id, body.action);
          setSaved(true);
          window.dispatchEvent(new Event(PROGRESS_EVENT));
        } catch {
          setError("Your action is shown below, but it was not saved to your account.");
        }
      }
    } catch {
      setError("The tutor did not answer. Your text is still here, so press Send again.");
    } finally {
      setBusy(false);
    }
  }

  function hold(start: boolean) {
    const rec = recRef.current;
    if (!rec) return;
    try {
      if (start) {
        if (canSpeak()) window.speechSynthesis.cancel();
        rec.start();
        setListening(true);
      } else {
        rec.stop();
      }
    } catch {
      setListening(false);
    }
  }

  return (
    <>
      <SiteHeader cta={false} />
      <main className="shell">
        <div className="lesson-top">
          <Link className="back" href={`/plan/${plan.id}/lesson/${position}`}>
            <ArrowLeft size={18} aria-hidden />
            Lesson
          </Link>
          <div className="dots" role="img" aria-label={`${Math.min(step, total)} of ${total} questions answered`}>
            {lesson.questions.map((_, index) => (
              <span key={index} className={index < step ? "dot done" : index === step ? "dot now" : "dot"} />
            ))}
          </div>
        </div>
        <div className="lesson-main tutor-column">
            <div className="lesson-head tone-purple">
              <div className="chips">
                <span className="tag">
                  <Mic size={14} aria-hidden />
                  Voice check-in · Lesson {position}
                </span>
              </div>
              <h1 className="page-title">Talk it through</h1>
              <p className="lede page-lede">
                Three questions about &ldquo;{lesson.title}&rdquo;. The tutor answers only from this lesson&apos;s saved notes.
              </p>
            </div>
            {exchanges.map((exchange, index) => (
              <div key={index} className="exchange" ref={index === exchanges.length - 1 ? latestRef : undefined}>
                <div className="msg tutor">
                  <span className="avatar">
                    <Sparkles size={18} aria-hidden />
                  </span>
                  <div className="bubble">
                    <div className="bubble-label">
                      Question {index + 1} of {total}
                    </div>
                    {exchange.question}
                  </div>
                </div>
                <div className="msg you">
                  <div className="bubble">{exchange.answer}</div>
                  <span className="avatar">
                    <User size={18} aria-hidden />
                  </span>
                </div>
                <div className="msg tutor">
                  <span className="avatar">
                    <Sparkles size={18} aria-hidden />
                  </span>
                  <div className="bubble">
                    {exchange.reply}
                    {exchange.cites.length > 0 && (
                      <div className="bubble-cites">
                        {exchange.cites.map((cite) => (
                          <span key={cite}>
                            <BookOpen size={13} aria-hidden />
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!done && (
              <section className="ask">
                <div className="msg tutor">
                  <span className="avatar">
                    <Sparkles size={18} aria-hidden />
                  </span>
                  <div className="bubble">
                    <div className="bubble-label">
                      Question {step + 1} of {total}
                    </div>
                    <h2>{question}</h2>
                  </div>
                </div>
                {canListen && (
                  <div className="mic-wrap">
                    <button
                      className={`mic${listening ? " live" : ""}`}
                      aria-pressed={listening}
                      aria-label="Hold to speak"
                      disabled={busy}
                      onMouseDown={() => hold(true)}
                      onMouseUp={() => hold(false)}
                      onMouseLeave={() => listening && hold(false)}
                      onTouchStart={() => hold(true)}
                      onTouchEnd={() => hold(false)}
                    >
                      <Mic size={30} aria-hidden />
                    </button>
                    <span>{listening ? "Listening… release when you are done" : "Hold to speak"}</span>
                  </div>
                )}
                <textarea
                  value={draft}
                  placeholder={canListen ? "Your words appear here. You can also type." : "Type your answer"}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button className="btn purple big" disabled={busy || !draft.trim()} onClick={submit}>
                  <Send size={18} aria-hidden />
                  {busy ? "The tutor is thinking…" : "Send answer"}
                </button>
              </section>
            )}
            {error && <p className="form-error">{error}</p>}
            {done && (
              <section className="result tone-purple">
                <div className="result-banner">
                  <span className="result-icon">
                    <Target size={30} aria-hidden />
                  </span>
                  <div>
                    <div className="result-title">Your action for today</div>
                    <div className="result-sub">Check-in complete · Lesson {position}</div>
                  </div>
                </div>
                <div className="result-body">
                  <p className="action-big">{action || lesson.action}</p>
                  {saved && (
                    <div className="rewards">
                      {!hadAction && (
                        <span className="xp-pill">
                          <Zap size={18} aria-hidden />+{XP.action} XP
                        </span>
                      )}
                      <span className="hint">Saved to this plan.</span>
                    </div>
                  )}
                  <div className="result-actions">
                    <Link className="btn primary" href={cleared && next ? gateHref(`/plan/${plan.id}/lesson/${next.position}`) : `/plan/${plan.id}`}>
                      {cleared && next ? "Next lesson" : "Back to the plan"}
                      <ArrowRight size={18} aria-hidden />
                    </Link>
                    {next && !cleared && <p className="hint">Earn at least one star on this lesson to open the next one.</p>}
                    {next && (
                      <Link className="btn ghost" href={`/plan/${plan.id}`}>
                        Back to the plan
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}
        </div>
      </main>
    </>
  );
}

export default function PlanTutorPage() {
  const params = useParams<{ id: string; n: string }>();
  return <TutorScreen key={`${params.id}-${params.n}`} planId={params.id} position={Number(params.n)} />;
}
