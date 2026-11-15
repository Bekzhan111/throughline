import { extractDocument } from "@/lib/document";
import { geminiJson } from "@/lib/gemini";
import { getSupabaseFor } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type Note = { source: string; point: string };
type RawLesson = {
  title?: string;
  minutes?: number;
  summary?: string;
  paragraphs?: { text?: string; source?: string }[];
  action?: string;
  questions?: string[];
  checks?: { prompt?: string; choices?: string[]; answer?: number; source?: string; note?: string }[];
};

const CHUNK = 60_000;
const MAX_CHUNKS = 6;

function pieces(text: string) {
  if (text.length <= 90_000) return [text];
  const parts: string[] = [];
  for (let index = 0; index < text.length; index += CHUNK) parts.push(text.slice(index, index + CHUNK));
  if (parts.length <= MAX_CHUNKS) return parts;
  const picked = new Set<number>();
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    picked.add(Math.round((index * (parts.length - 1)) / (MAX_CHUNKS - 1)));
  }
  return [...picked].sort((a, b) => a - b).map((index) => parts[index]);
}

function textOf(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function pinAnswer(choices: string[], answer: number) {
  const index = Number.isInteger(answer) && answer >= 0 && answer < choices.length ? answer : 0;
  const correct = choices[index];
  return [correct, ...choices.filter((_, choice) => choice !== index)].slice(0, 3);
}

function normalize(raw: { title?: string; summary?: string; lessons?: RawLesson[] }) {
  const lessons = (raw.lessons || []).slice(0, 8).flatMap((lesson) => {
    const paragraphs = (lesson.paragraphs || [])
      .map((paragraph) => ({ text: textOf(paragraph.text, 700), source: textOf(paragraph.source, 80) || "Your document" }))
      .filter((paragraph) => paragraph.text.length > 40)
      .slice(0, 3);
    const checks = (lesson.checks || [])
      .map((check) => {
        const choices = (check.choices || []).map((choice) => textOf(choice, 180)).filter(Boolean);
        if (choices.length < 3 || !textOf(check.prompt, 240)) return null;
        return {
          prompt: textOf(check.prompt, 240),
          choices: pinAnswer(choices, Number(check.answer)),
          answer: 0,
          source: textOf(check.source, 80) || paragraphs[0]?.source || "Your document",
          note: textOf(check.note, 280),
        };
      })
      .filter((check) => check !== null)
      .slice(0, 3);
    const questions = (lesson.questions || []).map((question) => textOf(question, 200)).filter(Boolean).slice(0, 3);
    if (!textOf(lesson.title, 120) || paragraphs.length === 0 || checks.length < 3) return [];
    while (questions.length < 3) {
      questions.push(
        ["What in this lesson matters for your goal?", "What will you use this week?", "What will you do today, in one sentence?"][questions.length],
      );
    }
    return [
      {
        title: textOf(lesson.title, 120),
        minutes: Math.min(25, Math.max(8, Number(lesson.minutes) || 12)),
        summary: textOf(lesson.summary, 280) || paragraphs[0].text,
        paragraphs,
        action: textOf(lesson.action, 280) || "Use one idea from this lesson before the day ends.",
        questions,
        checks,
      },
    ];
  });
  if (!lessons.length) throw new Error("The plan came back empty. Try again.");
  return {
    title: textOf(raw.title, 120) || "Your learning plan",
    summary: textOf(raw.summary, 500) || lessons[0].summary,
    lessons,
  };
}

async function notesFor(goal: string, excerpt: string, paged: boolean) {
  const parsed = (await geminiJson(
    `You read an excerpt of a document the learner uploaded. Their goal is: ${goal}
List only ideas that serve that goal. Write each one in your own words. Do not copy sentences from the excerpt.
${paged ? "Keep the page label already printed in the excerpt, such as Page 4." : "There are no page numbers. Name the part of the excerpt the idea came from, such as Opening or Later section."}
Return JSON: {"notes":[{"source":"Page 4","point":"one or two sentences"}]}
At most 8 notes. If nothing serves the goal, return {"notes":[]}.`,
    excerpt,
  )) as { notes?: Note[] };
  return (parsed.notes || [])
    .map((note) => ({ source: textOf(note.source, 80), point: textOf(note.point, 320) }))
    .filter((note) => note.point.length > 20)
    .slice(0, 8);
}

async function planFrom(goal: string, name: string, material: string, paged: boolean, fromNotes: boolean) {
  const parsed = (await geminiJson(
    `Build a learning plan for a person who uploaded "${name}".
Their goal: ${goal}
${fromNotes ? "The notes below were already written in our own words from their document." : "The document text follows. Page labels look like [Page 4]."}
Cover the goal and stop when it is covered. Use 3 to 8 lessons. A short document or a narrow goal gets fewer.
Each lesson is one sitting. Write every sentence in your own words. Do not reproduce the document.
Every paragraph and every check names a source label from the material.
Return JSON:
{"title": string, "summary": string, "lessons":[{"title": string, "minutes": number, "summary": string, "paragraphs":[{"text": string, "source": string}], "action": string, "questions":[string, string, string], "checks":[{"prompt": string, "choices":[string, string, string], "answer": 0, "source": string, "note": string}]}]}
Each lesson has 2 or 3 paragraphs and exactly 3 checks. The correct choice is first and answer is 0.
The third question asks what they will do today. ${paged ? "Source labels are page numbers." : "Source labels name a part of the document."}`,
    material,
  )) as { title?: string; summary?: string; lessons?: RawLesson[] };
  return normalize(parsed);
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The file did not upload. Try a smaller one." }, { status: 400 });
  }
  const goal = String(form.get("goal") || "").trim();
  const file = form.get("file");
  if (goal.length < 8) return NextResponse.json({ error: "Say a little more about what you want to learn." }, { status: 400 });
  if (goal.length > 400) return NextResponse.json({ error: "Keep the goal to a few sentences." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });

  try {
    const supabase = getSupabaseFor(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const extracted = await extractDocument(file);
    const chunks = pieces(extracted.text);
    let material = extracted.text;
    let fromNotes = false;
    if (chunks.length > 1) {
      const notes: Note[] = [];
      for (const chunk of chunks) notes.push(...(await notesFor(goal, chunk, extracted.paged)));
      if (!notes.length) return NextResponse.json({ error: "Nothing in that file serves this goal. Try a clearer goal or another file." }, { status: 422 });
      material = notes.map((note) => `${note.source}: ${note.point}`).join("\n");
      fromNotes = true;
    }

    const plan = await planFrom(goal.slice(0, 400), extracted.name, material, extracted.paged, fromNotes);
    const inserted = await supabase
      .from("plans")
      .insert({ user_id: userData.user.id, title: plan.title, goal: goal.slice(0, 400), summary: plan.summary, source_name: extracted.name })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) throw new Error(inserted.error?.message || "The plan was not saved.");

    const lessons = plan.lessons.map((lesson, index) => ({
      plan_id: inserted.data.id,
      position: index + 1,
      title: lesson.title,
      minutes: lesson.minutes,
      summary: lesson.summary,
      paragraphs: lesson.paragraphs,
      action: lesson.action,
      questions: lesson.questions,
      checks: lesson.checks,
    }));
    const saved = await supabase.from("plan_lessons").insert(lessons);
    if (saved.error) {
      await supabase.from("plans").delete().eq("id", inserted.data.id);
      throw new Error(saved.error.message);
    }
    return NextResponse.json({ id: inserted.data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The plan could not be built.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
