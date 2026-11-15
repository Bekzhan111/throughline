"use client";

import SiteHeader from "@/components/SiteHeader";
import { gateHref } from "@/lib/billing";
import SourceList from "@/components/SourceList";
import { firstWithoutStar, lessonIdeaIds, loadCourse, loadMine, PROGRESS_EVENT, saveAction, XP, type Course } from "@/lib/course";
import { getSupabase } from "@/lib/supabase";
import { canSpeak, makeUtterance } from "@/lib/voice";
import { ArrowLeft, ArrowRight, BookOpen, Mic, Send, Sparkles, Target, User, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Cite = { author: string; book: string; chapter: number };
type Exchange = { question: string; answer: string; reply: string; cites: Cite[] };

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

function TutorScreen({ day }: { day: number }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
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
        router.replace(`/login?mode=in&next=/tutor/${day}`);
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
        setUserId(user.id);
        setHadAction(mine.actions[day] !== undefined);
        setCleared((best[day] ?? 0) >= 1);
        setCourse(loaded);
      } catch {
        if (!cancelled) setLoadError("We could not load this check-in. Check your connection and reload the page.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [day, router]);

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

  const lesson = course?.lessons.find((item) => item.day === day);

  if (loadError || !course || !lesson) {
    return (
      <>
        <SiteHeader cta={false} />
        <main className="shell">
          <p className="lede">{loadError || (course ? "That day is not in the program." : "Loading the check-in…")}</p>
          {(loadError || course) && (
            <Link className="back" href="/program" style={{ marginTop: 16 }}>
              <ArrowLeft size={18} aria-hidden />
              Back to program
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
  const next = course.lessons.find((item) => item.day === day + 1);
  const sources = lessonIdeaIds(lesson)
    .map((id) => course.ideas[id])
    .filter(Boolean);

  async function submit() {
    const answer = draft.trim();
    if (!answer || busy || done) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, question, answer, step: step + 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("tutor failed");
      setExchanges((current) => [...current, { question, answer, reply: data.reply, cites: data.cites || [] }]);
      setDraft("");
      if (canSpeak()) {
        const utterance = await makeUtterance(data.reply);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      if (data.action) {
        setAction(data.action);
        try {
          await saveAction(userId, day, data.action);
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
          <Link className="back" href={`/lesson/${day}`}>
            <ArrowLeft size={18} aria-hidden />
            Lesson
          </Link>
          <div className="dots" role="img" aria-label={`${Math.min(step, total)} of ${total} questions answered`}>
            {lesson.questions.map((_, index) => (
              <span key={index} className={index < step ? "dot done" : index === step ? "dot now" : "dot"} />
            ))}
          </div>
        </div>

        <div className="lesson-grid">
          <div className="lesson-main">
            <div className="lesson-head tone-purple">
              <div className="chips">
                <span className="tag">
                  <Mic size={14} aria-hidden />
                  Voice check-in · Day {day}
                </span>
              </div>
              <h1 className="page-title">Talk it through</h1>
              <p className="lede page-lede">
                Three questions about &ldquo;{lesson.title}&rdquo;. The tutor answers only from this lesson&apos;s sources and reads its reply aloud.
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
                        {exchange.cites.map((cite, citeIndex) => (
                          <span key={citeIndex}>
                            <BookOpen size={13} aria-hidden />
                            {cite.book} · ch. {cite.chapter}
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
                    <div className="result-sub">Check-in complete · Day {day}</div>
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
                      <span className="hint">Saved to your program page.</span>
                    </div>
                  )}
                  <div className="result-actions">
                    <Link className="btn primary" href={cleared && next ? gateHref(`/lesson/${next.day}`) : "/program"}>
                      {cleared && next ? "Next lesson" : "Back to program"}
                      <ArrowRight size={18} aria-hidden />
                    </Link>
                    {next && !cleared && <p className="hint">Earn at least one star on this lesson to open the next one.</p>}
                    {next && (
                      <Link className="btn ghost" href="/program">
                        Back to program
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="lesson-side">
            <SourceList title="The tutor can only use" ideas={sources} />
          </aside>
        </div>
      </main>
    </>
  );
}

export default function TutorPage() {
  const params = useParams<{ day: string }>();
  return <TutorScreen key={params.day} day={Number(params.day)} />;
}
