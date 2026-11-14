# Throughline

**Pick a topic, not a book.** Throughline turns 5–10 nonfiction books on one topic into a 14–21 day program of short audio + text lessons. Every idea in a lesson links back to the book, author and chapter it came from, and an AI voice tutor checks what you learned using only that program's books.

Hackathon: Track 03 · Skills · US audience 25–45. Platform: web app (phone as a PWA + desktop).

- Design canvas: [Topic-first audio learning — design prototypes](https://claude.ai/artifact/a478aa7b-1302-45b2-8c47-e60e8422757b)
- PDF export of the canvas: [`design/design-prototypes.pdf`](design/design-prototypes.pdf)
- Screen sources (copy, colors, sample data): [`design/prototypes/`](design/prototypes/)
- Build plan: [`TASKS.md`](TASKS.md)

---

## The gap we're going after

Market scan of open sources, November 2026 (US base prices; promos exist).

| Service | Unit of learning | Synthesis across books | Source link | Audio | Voice tutor | Platform | Price |
|---|---|---|---|---|---|---|---|
| Blinkist | 1 book, ~15 min | partial (Guides) | whole book | yes | no (AI for external texts in Pro) | iOS, Android, web | $99.99/yr · Pro $174.99 |
| Headway | 1 book, 15 min | partial (AI paths) | whole book | yes | no | iOS, Android | $12.99/mo · $89.99/yr |
| Shortform | 1 book, chapter guide | partial (links in comments) | by chapter | yes | no | web, iOS, Android | $24/mo · $197/yr |
| Imprint | visual course | partial (Learning Paths) | whole book | no | no | iOS, Android | subscription, 7-day trial |
| BeFreed | AI audio lesson | yes, several per episode | not chapter-level | podcast format | partial (AI chat) | mobile app | freemium |
| NotebookLM | your uploaded files | only your files | quotes | Audio Overview | Interactive mode, EN only | web + mobile | free / Plus |
| **Throughline** | **topic program, 21 days** | **5–10 books in one program** | **book · author · chapter** | **core of the product** | **by voice** | **web: phone + desktop** | **[YOUR PRICE]** |

What the scan says:

1. **The market thinks in books.** Blinkist, Headway and Shortform sell a summary of one book. Their "topics" are playlists of those summaries, not one course.
2. **The source gets lost.** Only Shortform goes chapter by chapter, and only within one book. Nobody links idea → book → chapter inside a course.
3. **Voice is still an experiment.** NotebookLM lets you talk to AI hosts, but only about your own files, only in English, and there is no ready program.
4. **Main risk: BeFreed.** It already makes personalized AI audio lessons from several sources. Our edge: chapter-level citations, a course with an outcome, works in the browser.

---

## Product

### Core loop

```
Pick topic + minutes/day ──► Program generated (syllabus, bookshelf)
        │
        ▼
Today's lesson ──► Listen / Read + listen / Read  (every claim cited)
        │
        ▼
3-min voice check-in with the tutor ──► "Your action for today" saved to plan
        │
        ▼
End of week: 4-min audio recap + quick-check quiz (spaced review)
        │
        ▼
Listening mode: queue lessons + recaps for a commute or walk
```

### Three design directions (from the canvas)

| | Direction | Idea | Look |
|---|---|---|---|
| **A** | **Syllabus** — the program as a course plan | Transparency first: every idea is tied to book, author, chapter. For people who don't trust AI summaries. Web-first, same product as a PWA on the phone. | Light, IBM Plex Sans/Mono, blue `#1D3FD6` |
| **B** | **Night Radio** — audio at the center | Feels like a personal radio station for the topic. Open → press Play. Listening mode queues lessons and audio recaps for a walk or commute. The tutor is a separate "call" screen. | Dark `#0B0B10`, Inter + Space Grotesk, lime `#C6F432` |
| **C** | **Studio** — lesson and tutor side by side | A workspace for deliberate learning. Lesson text, voice tutor and player on one screen. Signature block: **"Where the books disagree."** | Light, Plus Jakarta Sans, violet `#5B3DF5`, yellow callout `#FFF6CC` |

**Recommendation for the hackathon:** ship one visual system (A's look — it sells the "trust/citations" story to judges), and pull in the strongest feature of each other direction: B's voice check-in + Listening mode, C's "Where the books disagree" block and weekly recap. Final call is open in [`TASKS.md`](TASKS.md) → Decisions.

### Screens

| # | Screen | Source file | Form factor | MVP? |
|---|---|---|---|---|
| 1 | Pick a topic → program preview | `A-Onboarding.dc.html` | phone | yes |
| 2 | Program page: today card, syllabus by week, bookshelf, listening-mode promo | `A-Program.dc.html` | desktop (responsive) | yes |
| 3 | Lesson: Listen / Read + listen / Read, synced highlight, inline source cards, player, mic button | `A-Lesson.dc.html` | phone | yes |
| 4 | Voice tutor session: 3-question plan, hold-Space-to-answer, transcript with citations, "answers grounded in", today's action | `B-Tutor.dc.html` | desktop | yes |
| 5 | Today: episode card with waveform, chapters, "after listening: voice check-in" | `B-Today.dc.html` | phone | stretch |
| 6 | Listening mode: Commute 40 / Walk 20 / Custom, queue of lessons + recaps + tutor, ETA | `B-Listen.dc.html` | phone | stretch |
| 7 | Studio: week sidebar, lesson with "Where the books disagree", inline voice tutor | `C-Workspace.dc.html` | desktop | stretch |
| 8 | Weekly recap: 5 ideas in 4 min with timestamps + citations, quick-check quiz | `C-Recap.dc.html` | phone | stretch |

Sample content in the designs: **Personal Finance: from paycheck to plan** — 21 lessons, 12 min/day, 8 books (Housel, Sethi, Collins, Stanley & Danko, Ramsey, Bogle, Robin & Dominguez, Perkins). Other onboarding topics: Investing basics, Negotiation, Habits, Productivity, First-time manager, Hard conversations, Better sleep.

---

## How it works (technical)

### The hard part: citations that are true

The whole pitch rests on "every idea links to book · author · chapter". If the LLM invents chapter numbers, the product is worse than Blinkist. So lessons are **generated from a source map, never from the model's memory alone**:

1. **Source map per book** (`content/books/<slug>.json`): chapter list + 3–8 key ideas per chapter in our own words, with chapter numbers verified by a human. This is the only ground truth the generator may cite.
2. **Program planner** (LLM): topic + books' source maps → 21-day syllabus. Each lesson lists which `book#chapter` ideas it uses.
3. **Lesson writer** (LLM): writes the lesson script; every paragraph carries `cites: ["sethi-iwt#5", "housel-pom#10"]`. A validator rejects any cite not present in the source map.
4. **Disagreement finder** (LLM): flags ideas where books conflict (e.g. Ramsey snowball vs. math-first avalanche) → "Where the books disagree" block.
5. **Audio**: lesson script → TTS → MP3 + word/sentence timestamps (for synced highlight and chapter markers).
6. **Tutor**: voice loop (speech-to-text → LLM restricted to the program's source map → TTS). It says so when a question goes beyond the program's books.

> **Copyright:** we never store or reproduce book text. Lessons are original syntheses with attribution, like a teacher's notes. Keep quotes out of generated scripts.

### Proposed stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind, installable PWA | One codebase for phone + desktop, as the designs require |
| Data / auth / files | Supabase (Postgres, Auth, Storage for MP3s) | Fast to stand up; storage + signed URLs for audio |
| LLM | Claude via Anthropic API (`claude-sonnet-5-5` for generation, structured JSON output) | Long-context synthesis + reliable schema output |
| TTS | ElevenLabs or OpenAI TTS — decide in T0 | Need natural voice + timestamps |
| Speech-to-text | Browser Web Speech API for the demo; Whisper/Deepgram if quality is poor | Zero setup first |
| Hosting | Vercel | Preview URL per PR for the demo |

### Data model (first cut)

```
book(id, slug, title, author, cover_color)
book_chapter(id, book_id, number, title)
source_idea(id, chapter_id, text)                    -- the citable unit
topic(id, slug, label)
program(id, topic_id, title, days, minutes_per_day)
program_book(program_id, book_id)
lesson(id, program_id, day, week, title, summary, script_json, audio_url, duration_s, timestamps_json)
lesson_citation(lesson_id, paragraph_idx, source_idea_id)
disagreement(id, lesson_id, side_a_json, side_b_json, tiebreaker_text)
recap(id, program_id, week, script_json, audio_url)
quiz_item(id, recap_id, question, options_json, answer_idx, source_idea_id)
user_program(user_id, program_id, current_day, streak, started_at)
tutor_session(id, user_id, lesson_id, transcript_json, action_text, created_at)
listen_queue(user_id, items_json, mode)               -- commute / walk / custom
```

### Repository layout (target)

```
.
├── README.md
├── TASKS.md
├── design/
│   ├── design-prototypes.pdf      # visual reference, 10 pages
│   └── prototypes/                # canvas artboard sources (.dc.html) + canvas.json
├── app/                           # Next.js routes (onboarding, program, lesson, tutor, listen, recap)
├── components/                    # player, citation card, syllabus, transcript…
├── lib/
│   ├── generate/                  # planner, lesson writer, cite validator, disagreement finder
│   ├── audio/                     # TTS + timestamps
│   └── tutor/                     # STT → LLM → TTS loop
├── content/
│   └── books/                     # hand-verified source maps (JSON)
└── supabase/                      # migrations + seed
```

> The `.dc.html` files are design-canvas artboards; they load the canvas runtime (`support.js`) and won't render standalone. Open the canvas link or the PDF to see them; read the files for exact copy, colors and sample data.

---

## Getting started

Nothing is scaffolded yet — see `TASKS.md` → Phase 0. Once it is:

```bash
git clone https://github.com/Rasreal/e-reader-hackathon.git
cd e-reader-hackathon
cp .env.example .env.local   # ANTHROPIC_API_KEY, TTS key, Supabase URL + anon key
npm install
npm run dev                  # http://localhost:3000
```

## Demo script (target, 3 minutes)

1. Pick **Personal finance**, 15 min/day → preview shows 21 lessons, 8 books → **Build my program**.
2. Program page: syllabus by week, bookshelf with "cited in N lessons".
3. Open Day 7 **Pay yourself first** → Read + listen; tap the ¹ footnote → *I Will Teach You to Be Rich*, Ch. 5.
4. Voice check-in: tutor asks "Your paycheck lands on Friday — what should happen before you spend anything?"; answer by voice; tutor cites Sethi Ch. 5 and saves today's action.
5. (Stretch) Listening mode: queue the rest of week 2 for a 40-min commute.
6. Close on the comparison table: nobody else links idea → book → chapter inside a course.
