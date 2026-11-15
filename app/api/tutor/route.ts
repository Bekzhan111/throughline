import { citesForLesson, ideaById, lessonByDay } from "@/content/program";
import { NextResponse } from "next/server";

type Body = {
  day: number;
  question: string;
  answer: string;
  step: number;
};

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const body = (await request.json()) as Body;
  const lesson = lessonByDay(body.day);
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });

  const sources = citesForLesson(lesson)
    .map(
      (idea) =>
        `${idea.id} | ${idea.author}, ${idea.book}, chapter ${idea.chapter} (${idea.chapterTitle}): ${idea.text}`,
    )
    .join("\n");

  const system = `You are the Throughline tutor for one personal-finance lesson.
You may use ONLY the source ideas below. If the learner asks something these ideas do not cover, say so in one sentence and bring them back to the lesson.
Do not invent chapter numbers. Do not quote books.
Reply as spoken audio: 2 to 4 short sentences.
On the last step (step 3), end by stating one concrete action for today.
Return JSON: {"reply": string, "cites": string[], "outOfScope": boolean, "action": string}
cites must be idea ids from the list. action is required only on step 3, otherwise "".

LESSON: Day ${lesson.day} — ${lesson.title}
TODAY'S PLANNED ACTION: ${lesson.action}
QUESTION ${body.step} OF 3: ${body.question}

SOURCES:
${sources}`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: body.answer || "(no answer)" }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "Tutor request failed", detail }, { status: 502 });
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  try {
    const parsed = JSON.parse(text);
    const cites = Array.isArray(parsed.cites)
      ? parsed.cites.map((id: string) => ideaById(id)).filter(Boolean)
      : [];
    return NextResponse.json({
      reply: parsed.reply || "Say that once more, in one sentence.",
      cites,
      outOfScope: Boolean(parsed.outOfScope),
      action: body.step === 3 ? parsed.action || lesson.action : "",
    });
  } catch {
    return NextResponse.json({
      reply: text.slice(0, 500) || "I lost that. Try the sentence again.",
      cites: citesForLesson(lesson).slice(0, 1),
      outOfScope: false,
      action: body.step === 3 ? lesson.action : "",
    });
  }
}
