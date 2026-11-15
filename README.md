# Throughline

Throughline is a daily learning app for adults. The ready-made program is personal finance: 21 short lessons drawn from 8 real books. You can also upload your own document, name a goal, and get a separate program from that file.

Every idea names where it came from: book, author, and chapter, or a section of the file you uploaded. Lessons are written in original words. Book text is not stored.

## What you can do

- Follow the finance program, one lesson at a time.
- Upload a PDF, Word file, or text file and turn it into its own program.
- Listen to a lesson in the browser. The highlight follows the paragraph being read.
- Answer three questions. Each right answer is a star. One star opens the next lesson.
- Talk the idea through with a tutor that stays inside that lesson.
- Keep a streak and XP from real completed lessons, stars, and saved actions.

## Plans

| Plan | Price |
|---|---|
| Free | $0 |
| Pro, monthly | $12 a month |
| Pro, yearly | $79 a year |

Free and Pro include the same lessons. Checkout is in test mode. The card is `4242 4242 4242 4242`, with any future date and any 3-digit code. Nothing is charged.

## Stack

- Next.js 15, React 19, TypeScript
- Supabase for accounts and saved progress
- Gemini for the tutor and for building a program from an uploaded file
- The browser’s own speech for listening and for speaking an answer

## Run it locally

Use Node 22.

Create `.env.local` in the project folder:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
GEMINI_API_KEY=
```

`SUPABASE_DB_PASSWORD` is only used by the seed script. The app itself needs the other four.

```bash
npm install
node scripts/seed.mjs
npm run dev
```

Open http://localhost:3000.

The seed script creates the tables and loads the finance course. It also clears saved lesson progress, so run it once on an empty database.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm start` | Serve the production build |
| `node scripts/seed.mjs` | Create tables and load the finance course |

## Project layout

```
app/            pages and API routes
components/     header, stars, source list, plan cards
content/        finance lessons and checks
lib/            course progress, plans, voice, Gemini, billing
supabase/       database schema
scripts/        seed script
```

Main routes:

| Route | Page |
|---|---|
| `/` | Landing |
| `/start` | Choose a goal |
| `/programs` | Programs in progress |
| `/program` | The 21-day finance program |
| `/plan/new` | Upload a document |
| `/library` | The eight books |
| `/pricing` | Free and Pro |
| `/lesson/[day]` | A finance lesson |
| `/tutor/[day]` | The tutor for that lesson |

## Deploy

On Vercel, create a project from this repo and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`. Vercel’s free plan rejects an upload larger than 4.5 MB. The app itself accepts files up to 12 MB.
