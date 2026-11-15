"use client";

import SiteHeader from "@/components/SiteHeader";
import { topics } from "@/content/program";
import { loadCourse, type Book } from "@/lib/course";
import { getSupabase } from "@/lib/supabase";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Compass,
  Handshake,
  MessagesSquare,
  Moon,
  PiggyBank,
  Repeat,
  Timer,
  TrendingUp,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TOPIC_LOOK: Record<string, { Icon: LucideIcon; tone: string }> = {
  fin: { Icon: PiggyBank, tone: "green" },
  inv: { Icon: TrendingUp, tone: "blue" },
  neg: { Icon: Handshake, tone: "orange" },
  hab: { Icon: Repeat, tone: "purple" },
  pro: { Icon: Timer, tone: "gold" },
  lead: { Icon: Users, tone: "blue" },
  com: { Icon: MessagesSquare, tone: "purple" },
  slp: { Icon: Moon, tone: "orange" },
};

export default function StartPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("fin");
  const [minutes, setMinutes] = useState(15);
  const [books, setBooks] = useState<Book[]>([]);
  const ready = topic === "fin";

  useEffect(() => {
    loadCourse()
      .then((course) => setBooks(course.books))
      .catch(() => setBooks([]));
  }, []);

  async function build() {
    const { data } = await getSupabase().auth.getSession();
    router.push(data.session ? "/program" : "/login?next=/program");
  }

  return (
    <>
      <SiteHeader cta={false} />
      <main className="shell start-grid">
        <section>
          <div className="kicker">STEP 1 OF 2</div>
          <h1 className="page-title">What do you want to get better at?</h1>
          <p className="lede page-lede">Pick a topic, not a book. We build the program from the best books on it.</p>

          <div className="topic-grid">
            {topics.map((item) => {
              const look = TOPIC_LOOK[item.id] || { Icon: Compass, tone: "blue" };
              return (
                <button
                  key={item.id}
                  className={`topic tone-${look.tone}`}
                  aria-pressed={topic === item.id}
                  onClick={() => setTopic(item.id)}
                >
                  <span className="tile big">
                    <look.Icon size={26} aria-hidden />
                  </span>
                  <span className="topic-name">{item.label}</span>
                  <span className={item.ready ? "topic-state ready" : "topic-state"}>
                    {item.ready ? (
                      <>
                        <Check size={13} strokeWidth={3.5} aria-hidden />
                        Ready
                      </>
                    ) : (
                      "Soon"
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <Link className="doc-entry" href="/plan/new">
            <span className="tile big tone-purple">
              <Upload size={26} aria-hidden />
            </span>
            <span>
              <strong>I already have a document</strong>
              <span>Upload it, name the goal, and we build a plan just for that.</span>
            </span>
            <ArrowRight size={18} aria-hidden />
          </Link>

          <div className="time-block">
            <div className="time-label">
              <Clock size={18} aria-hidden />
              Time per day
            </div>
            <div className="minutes">
              {[10, 15, 20].map((value) => (
                <button key={value} className="minute" aria-pressed={minutes === value} onClick={() => setMinutes(value)}>
                  {value} min
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="card preview-card">
          <div className="kicker">YOUR PROGRAM PREVIEW</div>
          <h2>{ready ? "Personal Finance: from paycheck to plan" : "This topic is next"}</h2>
          {ready ? (
            <div className="chips">
              <span className="tag tone-blue">21 lessons</span>
              <span className="tag tone-orange">{minutes} min a day</span>
              <span className="tag tone-purple">{books.length || 8} books</span>
            </div>
          ) : (
            <p className="hint">The live course today is Personal Finance.</p>
          )}
          {ready && (
            <ul className="preview-books">
              {books.slice(0, 3).map((book) => (
                <li key={book.slug}>
                  <span className="cover" style={{ background: book.color }} />
                  <span>
                    <strong>{book.title}</strong>
                    <span className="by">{book.author}</span>
                  </span>
                </li>
              ))}
              {books.length > 3 && (
                <li className="more">
                  <BookOpen size={16} aria-hidden />+ {books.length - 3} more books
                </li>
              )}
            </ul>
          )}
          <button className="btn primary big block" disabled={!ready} onClick={build}>
            {ready ? "Build my program" : "Choose Personal Finance to start"}
            {ready && <ArrowRight size={18} aria-hidden />}
          </button>
        </aside>
      </main>
    </>
  );
}
