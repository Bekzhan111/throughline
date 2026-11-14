# Throughline — tasks

Goal: a working web demo of the core loop on one topic, **Personal Finance (21 days, 8 books)**: pick topic → program → cited lesson with audio → voice check-in. Everything else is stretch.

Priority: **P0** = demo breaks without it · **P1** = makes the demo land · **P2** = stretch.
Put your name in `Owner` when you take a task. Screen files live in `design/prototypes/`.

---

## Decisions to make first (Phase 0, before code)

- [ ] **D1 · Visual direction.** Recommended: A's look (light, IBM Plex, blue) + B's voice check-in and Listening mode + C's "Where the books disagree" and weekly recap.
- [ ] **D2 · TTS provider.** ElevenLabs vs OpenAI TTS. Must return word or sentence timestamps (or we align afterwards). Pick by voice quality on one 12-min lesson.
- [ ] **D3 · Speech-to-text for the tutor.** Start with the browser Web Speech API (Chrome/Safari); switch to Whisper/Deepgram only if it fails on stage.
- [ ] **D4 · Pre-generated vs live.** Recommended: pre-generate the full Personal Finance program and its audio; live generation only for the onboarding preview (stretch: full live generation for a 2nd topic).
- [ ] **D5 · Price** to show in the comparison table and pitch (`[YOUR PRICE]` in the designs).
- [ ] **D6 · Team split** (suggested: 1 content/generation, 1 frontend, 1 audio + tutor, 1 pitch/design QA).

---

## Phase 0 · Setup

| P | Task | Owner |
|---|---|---|
| P0 | Scaffold Next.js (App Router) + TypeScript + Tailwind; PWA manifest + icons | |
| P0 | Supabase project; `.env.example` with `ANTHROPIC_API_KEY`, TTS key, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| P0 | Vercel project linked to the repo; preview deploy per PR | |
| P1 | Design tokens from the chosen direction (colors, fonts, radii) into Tailwind config | |
| P1 | ESLint + Prettier; one CI check (typecheck + lint) | |

## Phase 1 · Content: source maps (the citation ground truth)

The product promise is "every idea → book · author · chapter". These files are what makes that true.

| P | Task | Owner |
|---|---|---|
| P0 | JSON schema for a source map: `book {slug, title, author, cover_color, chapters[{number, title, ideas[{id, text}]}]}` | |
| P0 | Write source maps for the 8 books: *The Psychology of Money* (Housel), *I Will Teach You to Be Rich* (Sethi), *The Simple Path to Wealth* (Collins), *The Millionaire Next Door* (Stanley & Danko), *The Total Money Makeover* (Ramsey), *The Little Book of Common Sense Investing* (Bogle), *Your Money or Your Life* (Robin & Dominguez), *Die With Zero* (Perkins) | |
| P0 | Human check of every chapter number and title against a real table of contents | |
| P1 | Ideas written in our own words, no quotes from the books (copyright) | |

## Phase 2 · Generation pipeline (`lib/generate/`)

| P | Task | Owner |
|---|---|---|
| P0 | DB migrations for the data model in the README (`book`, `book_chapter`, `source_idea`, `program`, `lesson`, `lesson_citation`, …) | |
| P0 | **Program planner**: topic + source maps → 21-day syllabus in 3 weeks (titles, summaries, idea ids per lesson). Match the syllabus in `A-Program.dc.html` as the target shape | |
| P0 | **Lesson writer**: lesson → script of paragraphs, each with `cites[]` of source-idea ids; target length from minutes/day | |
| P0 | **Cite validator**: reject/regenerate any lesson citing an id not in the source map; fail the build if a lesson has a paragraph with no cite | |
| P0 | Seed script: run the pipeline for Personal Finance and write to Supabase | |
| P1 | Chapter markers per lesson (e.g. 0:00 The leftover trap · 3:40 Flip the order · 7:10 Automate it · 10:30 Your one action) | |
| P1 | **Disagreement finder**: detect conflicting ideas across books → `{side_a, side_b, tiebreaker}` (Ramsey snowball vs avalanche; tie-breaker from Housel) | |
| P1 | "Your one action for today" generated per lesson | |
| P2 | Weekly recap script: 5 ideas in ~4 min with timestamps + citations | |
| P2 | Quiz items per recap (3 questions, each tied to a source idea) | |

## Phase 3 · Audio (`lib/audio/`)

| P | Task | Owner |
|---|---|---|
| P0 | TTS each lesson script → MP3 in Supabase Storage | |
| P0 | Sentence-level timestamps (from TTS or forced alignment) saved as `timestamps_json` | |
| P1 | Playback speed (1.0× / 1.25× / 1.5×), ±15 s skip, resume position per user | |
| P2 | Audio for weekly recaps | |

## Phase 4 · Frontend screens

| P | Screen | Source | Must have | Owner |
|---|---|---|---|---|
| P0 | **Onboarding** | `A-Onboarding.dc.html` | 8 topic chips, 10/15/20 min selector, live program preview (title, lessons, books, 3 sample books, "+N more"), **Build my program** | |
| P0 | **Program page** | `A-Program.dc.html` | Header + progress (Day 7 of 21), Today card with source chips and Listen & read / Read only, syllabus by week (completed / in progress / up next), bookshelf with "cited in N lessons"; responsive to phone | |
| P0 | **Lesson** | `A-Lesson.dc.html` | Listen / Read + listen / Read toggle; paragraph highlight synced to audio; superscript cite → source card (book, author, chapter); bottom player; mic button → tutor | |
| P0 | **Voice tutor** | `B-Tutor.dc.html` | 3-step session plan, question card, Hold Space / tap to answer, Type instead, Give me a hint, live transcript with citation chips, "Answers grounded in" list, "Your action for today" saved on End session | |
| P1 | Disagreement block inside lessons | `C-Workspace.dc.html` | Two cards (author view vs other view) + tie-breaker line | |
| P1 | Streak counter + "Day N of 21" progression | `A-Program.dc.html` | Mark lesson complete when audio ends or text is scrolled to the end | |
| P2 | **Today (radio)** | `B-Today.dc.html` | Episode card with waveform, chapter list, bottom tabs (Today / Program / Listen / Tutor) | |
| P2 | **Listening mode** | `B-Listen.dc.html` | Commute 40 / Walk 20 / Custom presets build a queue of lessons + recap + tutor check-in; "ends ≈" time; prev/next | |
| P2 | **Studio** | `C-Workspace.dc.html` | Week sidebar, lesson, inline tutor panel with Quiz me / Explain simpler / Show the source | |
| P2 | **Weekly recap** | `C-Recap.dc.html` | 4-min player with timestamped ideas + cites, quick-check quiz, "Ask the tutor about my mistakes" | |
| P2 | Hands-free "Hey, explain that" during listening | `B-Listen.dc.html` | | |

## Phase 5 · Voice tutor backend (`lib/tutor/`)

| P | Task | Owner |
|---|---|---|
| P0 | Session plan: warm-up → apply it → commit (3 questions from the lesson's ideas) | |
| P0 | Loop: STT → Claude with system prompt restricted to the program's source map → TTS reply; every answer returns the source ids it used | |
| P0 | Out-of-scope guard: tutor says when a question goes beyond the program's books | |
| P1 | Latency budget: first audio of reply < 2 s (stream LLM tokens into TTS) | |
| P1 | Save transcript + action to `tutor_session`; show action on the program page | |
| P2 | Personalisation from the user's own numbers (e.g. "$900 at 24% and $4,100 at 19%" → which debt first) | |

## Phase 6 · Pitch and demo

| P | Task | Owner |
|---|---|---|
| P0 | Rehearse the 3-minute demo script in the README end to end on the deployed URL | |
| P0 | Offline fallback: pre-recorded tutor exchange + cached audio in case venue Wi-Fi or mic fails | |
| P1 | Pitch slides: problem (market thinks in books), gap table, demo, BeFreed answer, price, next topics | |
| P1 | Test on a real phone (iOS Safari + Android Chrome): install PWA, audio in background, mic permission | |
| P2 | Short screen recording of the demo as backup | |

---

## Open questions

- Can we legally name books and chapters and summarise ideas in a paid product? (Attribution + own-words summaries is the plan; confirm before launch, fine for the hackathon.)
- Who verifies source maps for new topics after the hackathon — human editors, or publisher partnerships?
- Should a user be able to add their own book to a program (NotebookLM-style), or is the curated bookshelf the point?
- Accounts for the demo: magic link via Supabase, or a single demo user?
