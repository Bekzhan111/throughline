import SiteHeader from "@/components/SiteHeader";
import { dollars, PRICES } from "@/lib/billing";
import { loadCourse, type Book } from "@/lib/course";
import { ArrowRight, BookOpen, Clock, Compass, Flame, ListChecks, Mic, Play, Star, Zap } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    tone: "blue",
    Icon: Compass,
    title: "Name the goal",
    text: "Personal finance is ready to start. Or upload a file and say what you want from it. The plan is as long as that goal needs.",
  },
  {
    tone: "green",
    Icon: BookOpen,
    title: "Read it with the source",
    text: "Every idea names the book and chapter, or the section of the file you uploaded. Tap the tag and the source is right there.",
  },
  {
    tone: "gold",
    Icon: ListChecks,
    title: "Check yourself",
    text: "Three quick questions close each lesson. Each right answer is a star, and a missed one shows the idea behind it.",
  },
  {
    tone: "purple",
    Icon: Mic,
    title: "Say it back",
    text: "A short voice check-in asks what you will do with the idea. The tutor stays inside the lesson you just read.",
  },
];

export default async function Landing() {
  let books: Book[] = [];
  try {
    books = (await loadCourse()).books;
  } catch {
    books = [];
  }
  const sethi = books.find((book) => book.slug === "sethi")?.color || "#b4381f";

  return (
    <div className="landing">
      <SiteHeader />
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            Learn one skill, <span>a little each day.</span>
          </h1>
          <p className="hero-lede">
            Follow the personal-finance program on the shelf, or upload a document and a goal and get a plan of your own. Each lesson names where
            the idea came from, and ends with one thing to do today.
          </p>
          <div className="hero-actions">
            <Link className="btn primary big" href="/start">
              <Play size={18} aria-hidden />
              Build a program
            </Link>
            <a className="btn ghost big" href="#how">
              See how a day works
            </a>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>8</dt>
              <dd>books on the shelf</dd>
            </div>
            <div>
              <dt>1</dt>
              <dd>goal, in your words</dd>
            </div>
            <div>
              <dt>15</dt>
              <dd>minutes a day</dd>
            </div>
          </dl>
        </div>

        <aside className="hero-card" aria-label="A lesson from the personal finance program">
          <div className="hero-card-top">
            <span className="tag">Day 7 of 21</span>
            <span className="tag plain">
              <Clock size={14} aria-hidden />
              12 min
            </span>
          </div>
          <h2>Pay yourself first</h2>
          <p>
            The moment the paycheck lands, a slice leaves for savings before you can spend it. Waiting until the end of the month to see what is
            left usually leaves nothing.
          </p>
          <div className="source" style={{ borderColor: sethi }}>
            <span className="cover" style={{ background: sethi }} />
            <div>
              <strong>I Will Teach You to Be Rich</strong>
              <div className="source-meta">Ramit Sethi · Chapter 5: Save While Sleeping</div>
            </div>
          </div>
          <ul className="hero-earn" aria-label="What each day gives you">
            <li className="tone-gold">
              <Star size={16} aria-hidden />
              Stars for right answers
            </li>
            <li className="tone-orange">
              <Flame size={16} aria-hidden />
              A daily streak
            </li>
            <li className="tone-blue">
              <Zap size={16} aria-hidden />
              XP for each lesson
            </li>
          </ul>
        </aside>
      </section>

      <section className="how" id="how">
        <div className="section-head">
          <div className="kicker">HOW A DAY WORKS</div>
          <h2>Four small steps, about fifteen minutes.</h2>
        </div>
        <div className="how-grid">
          {steps.map((step, index) => (
            <article key={step.title} className={`how-card tone-${step.tone}`}>
              <span className="tile big">
                <step.Icon size={26} aria-hidden />
              </span>
              <div className="kicker">STEP {index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shelf" id="sources">
        <div className="section-head">
          <div className="kicker">THE BOOKSHELF</div>
          <h2>Eight books, already turned into one plan.</h2>
          <p className="lede">
            The lessons are written in our own words, and the chapter numbers lead back to the book. You can also bring a file of your own and keep
            that program beside this one.
          </p>
        </div>
        <ul className="book-grid">
          {books.map((book) => (
            <li key={book.slug}>
              <span className="cover big" style={{ background: book.color }}>
                <BookOpen size={20} aria-hidden />
              </span>
              <div>
                <strong>{book.title}</strong>
                <span>{book.author}</span>
              </div>
            </li>
          ))}
        </ul>
        <Link className="btn ghost" href="/library">
          Open the library
          <ArrowRight size={18} aria-hidden />
        </Link>
      </section>

      <section className="rates" id="pricing">
        <div className="section-head">
          <div className="kicker">THE PRICE</div>
          <h2>Free, or Pro at {dollars(PRICES.month)} a month.</h2>
          <p className="lede">Pro is also {dollars(PRICES.year)} for the year. Both plans include the lessons.</p>
        </div>
        <div className="rate-row">
          <div>
            <strong>$0</strong>
            <span>Free</span>
          </div>
          <div>
            <strong>{dollars(PRICES.month)}</strong>
            <span>Pro monthly</span>
          </div>
          <div>
            <strong>{dollars(PRICES.year)}</strong>
            <span>Pro yearly</span>
          </div>
        </div>
        <Link className="btn ghost" href="/pricing">
          See the plans
          <ArrowRight size={18} aria-hidden />
        </Link>
      </section>

      <section className="close">
        <div>
          <div className="kicker">START WITH ONE GOAL</div>
          <h2>Personal finance is ready. A document you upload can become the next program.</h2>
        </div>
        <Link className="btn white big" href="/start">
          What do you want to get better at?
          <ArrowRight size={18} aria-hidden />
        </Link>
      </section>
    </div>
  );
}
