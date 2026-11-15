import { getSupabase } from "@/lib/supabase";

export type Book = { slug: string; title: string; author: string; color: string; position?: number };

export type Idea = {
  id: string;
  book: string;
  author: string;
  chapter: number;
  chapterTitle: string;
  text: string;
  color: string;
};

export type Paragraph = { text: string; cites: string[] };

export type Lesson = {
  day: number;
  week: number;
  weekTitle: string;
  title: string;
  minutes: number;
  summary: string;
  paragraphs: Paragraph[];
  action: string;
  questions: string[];
  disagreement?: {
    a: { author: string; text: string; cite: string };
    b: { author: string; text: string; cite: string };
    tie: string;
  };
};

export type Check = {
  prompt: string;
  choices: string[];
  answer: number;
  ideaId: string;
};

export type Course = {
  books: Book[];
  lessons: Lesson[];
  ideas: Record<string, Idea>;
  checks: Record<number, Check[]>;
};

type IdeaRow = { id: string; book_slug: string; chapter: number; chapter_title: string; body: string };
type LessonRow = {
  day: number;
  week: number;
  week_title: string;
  title: string;
  minutes: number;
  summary: string;
  action: string;
  questions: string[];
};
type ParaRow = { id: number; lesson_day: number; position: number; body: string };
type CiteRow = { paragraph_id: number; idea_id: string; position: number };
type DisRow = {
  lesson_day: number;
  a_author: string;
  a_text: string;
  a_cite: string;
  b_author: string;
  b_text: string;
  b_cite: string;
  tie: string;
};
type CheckRow = { lesson_day: number; position: number; prompt: string; choices: string[]; answer: number; idea_id: string };

export async function loadCourse(): Promise<Course> {
  const supabase = getSupabase();
  const [booksRes, ideasRes, lessonsRes, paragraphsRes, citesRes, disagreementsRes, checksRes] = await Promise.all([
    supabase.from("books").select("slug, title, author, color, position").order("position"),
    supabase.from("ideas").select("id, book_slug, chapter, chapter_title, body"),
    supabase.from("lessons").select("day, week, week_title, title, minutes, summary, action, questions").order("day"),
    supabase.from("paragraphs").select("id, lesson_day, position, body").order("position"),
    supabase.from("paragraph_cites").select("paragraph_id, idea_id, position").order("position"),
    supabase.from("disagreements").select("lesson_day, a_author, a_text, a_cite, b_author, b_text, b_cite, tie"),
    supabase.from("checks").select("lesson_day, position, prompt, choices, answer, idea_id").order("position"),
  ]);
  const failed = [booksRes, ideasRes, lessonsRes, paragraphsRes, citesRes, disagreementsRes, checksRes].find((item) => item.error);
  if (failed?.error) throw new Error(failed.error.message);

  const books = (booksRes.data || []) as Book[];
  const bookBySlug = Object.fromEntries(books.map((book) => [book.slug, book]));
  const ideas: Record<string, Idea> = {};
  for (const row of (ideasRes.data || []) as IdeaRow[]) {
    const book = bookBySlug[row.book_slug];
    ideas[row.id] = {
      id: row.id,
      book: book?.title || row.book_slug,
      author: book?.author || "",
      chapter: row.chapter,
      chapterTitle: row.chapter_title,
      text: row.body,
      color: book?.color || "#2f6bff",
    };
  }

  const citesByParagraph = new Map<number, CiteRow[]>();
  for (const cite of (citesRes.data || []) as CiteRow[]) {
    const list = citesByParagraph.get(cite.paragraph_id) || [];
    list.push(cite);
    citesByParagraph.set(cite.paragraph_id, list);
  }
  const paragraphsByDay = new Map<number, Paragraph[]>();
  for (const row of (paragraphsRes.data || []) as ParaRow[]) {
    const list = paragraphsByDay.get(row.lesson_day) || [];
    const cites = (citesByParagraph.get(row.id) || []).sort((a, b) => a.position - b.position).map((cite) => cite.idea_id);
    list.push({ text: row.body, cites });
    paragraphsByDay.set(row.lesson_day, list);
  }
  const disagreementByDay = new Map<number, Lesson["disagreement"]>();
  for (const row of (disagreementsRes.data || []) as DisRow[]) {
    disagreementByDay.set(row.lesson_day, {
      a: { author: row.a_author, text: row.a_text, cite: row.a_cite },
      b: { author: row.b_author, text: row.b_text, cite: row.b_cite },
      tie: row.tie,
    });
  }

  const lessons: Lesson[] = ((lessonsRes.data || []) as LessonRow[]).map((row) => ({
    day: row.day,
    week: row.week,
    weekTitle: row.week_title,
    title: row.title,
    minutes: row.minutes,
    summary: row.summary,
    paragraphs: paragraphsByDay.get(row.day) || [],
    action: row.action,
    questions: row.questions,
    disagreement: disagreementByDay.get(row.day),
  }));

  const checks: Record<number, Check[]> = {};
  for (const row of (checksRes.data || []) as CheckRow[]) {
    const list = checks[row.lesson_day] || [];
    list.push({ prompt: row.prompt, choices: row.choices, answer: row.answer, ideaId: row.idea_id });
    checks[row.lesson_day] = list;
  }

  return { books, lessons, ideas, checks };
}

export function shortAuthor(author: string) {
  const parts = author.split(" & ")[0].trim().split(" ");
  return parts[parts.length - 1];
}

export function lessonIdeaIds(lesson: Lesson) {
  const ids = new Set(lesson.paragraphs.flatMap((paragraph) => paragraph.cites));
  if (lesson.disagreement) {
    ids.add(lesson.disagreement.a.cite);
    ids.add(lesson.disagreement.b.cite);
  }
  return [...ids];
}

export type Attempt = { lesson_day: number; score: number; total: number; missed: { prompt: string; ideaId: string }[]; created_at: string };

export type Mine = {
  completed: number[];
  actions: Record<number, string>;
  attempts: Attempt[];
};

export async function loadMine(userId: string): Promise<Mine> {
  const supabase = getSupabase();
  const [progress, actions, attempts] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_day").eq("user_id", userId),
    supabase.from("saved_actions").select("lesson_day, body").eq("user_id", userId),
    supabase.from("quiz_attempts").select("lesson_day, score, total, missed, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const failed = [progress, actions, attempts].find((item) => item.error);
  if (failed?.error) throw new Error(failed.error.message);
  return {
    completed: (progress.data || []).map((row) => row.lesson_day as number),
    actions: Object.fromEntries((actions.data || []).map((row) => [row.lesson_day as number, row.body as string])),
    attempts: (attempts.data || []) as Attempt[],
  };
}

export const XP = { lesson: 10, correct: 5, action: 5 };

export type Stats = {
  xp: number;
  streak: number;
  stars: number;
  best: Record<number, number>;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function streakFrom(dates: string[]) {
  const active = new Set(dates.map((value) => dayKey(new Date(value))));
  const cursor = new Date();
  if (!active.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (active.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function firstWithoutStar<T>(items: T[], stars: (item: T) => number) {
  return items.find((item) => stars(item) < 1);
}

export function computeStats(mine: Mine): Stats {
  const best: Record<number, number> = {};
  for (const attempt of mine.attempts) {
    best[attempt.lesson_day] = Math.max(best[attempt.lesson_day] ?? 0, attempt.score);
  }
  const stars = Object.values(best).reduce((sum, score) => sum + score, 0);
  const xp = mine.completed.length * XP.lesson + stars * XP.correct + Object.keys(mine.actions).length * XP.action;

  return { xp, stars, streak: streakFrom(mine.attempts.map((attempt) => attempt.created_at)), best };
}

export const PROGRESS_EVENT = "throughline:progress";

export async function completeLesson(userId: string, day: number) {
  const { error } = await getSupabase()
    .from("lesson_progress")
    .upsert({ user_id: userId, lesson_day: day, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_day", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function saveAction(userId: string, day: number, body: string) {
  const { error } = await getSupabase()
    .from("saved_actions")
    .upsert({ user_id: userId, lesson_day: day, body, updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_day" });
  if (error) throw new Error(error.message);
}

export async function saveAttempt(userId: string, day: number, score: number, total: number, missed: { prompt: string; ideaId: string }[]) {
  const { error } = await getSupabase().from("quiz_attempts").insert({ user_id: userId, lesson_day: day, score, total, missed });
  if (error) throw new Error(error.message);
}
