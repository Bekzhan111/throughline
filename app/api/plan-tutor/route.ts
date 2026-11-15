import { geminiJson } from "@/lib/gemini";
import type { PlanParagraph } from "@/lib/plans";
import { getSupabaseFor } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { planId?: string; position?: number; question?: string; answer?: string; step?: number };

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await request.json()) as Body;
  const supabase = getSupabaseFor(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const plan = await supabase.from("plans").select("id, goal").eq("id", body.planId || "").maybeSingle();
  if (plan.error || !plan.data) return NextResponse.json({ error: "That plan is not on this account." }, { status: 404 });
  const lesson = await supabase
    .from("plan_lessons")
    .select("title, summary, action, paragraphs")
    .eq("plan_id", plan.data.id)
    .eq("position", Number(body.position))
    .maybeSingle();
  if (lesson.error || !lesson.data) return NextResponse.json({ error: "That lesson is not in this plan." }, { status: 404 });

  const paragraphs = (lesson.data.paragraphs || []) as PlanParagraph[];
  const notes = paragraphs.map((paragraph) => `${paragraph.source}: ${paragraph.text}`).join("\n");
  const step = Number(body.step) || 1;
  try {
    const parsed = (await geminiJson(
      `You are the Throughline tutor for one lesson from a plan the learner built from their own document.
You may use ONLY the lesson notes below. They are already written in our own words.
If the learner asks something these notes do not cover, say so in one sentence and bring them back.
Do not invent page numbers. Do not quote the document.
Reply as spoken audio: 2 to 4 short sentences.
On step 3, end by stating one concrete action for today.
Return JSON: {"reply": string, "cites": string[], "action": string}
cites must be source labels from the notes, or []. action is required only on step 3, otherwise "".

GOAL: ${plan.data.goal}
LESSON: ${lesson.data.title}
SUMMARY: ${lesson.data.summary}
PLANNED ACTION: ${lesson.data.action}
QUESTION ${step} OF 3: ${body.question || ""}

NOTES:
${notes}`,
      body.answer || "(no answer)",
    )) as { reply?: string; cites?: string[]; action?: string };
    const allowed = new Set(paragraphs.map((paragraph) => paragraph.source));
    const cites = (parsed.cites || []).map((cite) => String(cite)).filter((cite) => allowed.has(cite));
    return NextResponse.json({
      reply: parsed.reply || "Say that once more, in one sentence.",
      cites,
      action: step === 3 ? parsed.action || lesson.data.action : "",
    });
  } catch {
    return NextResponse.json({ error: "The tutor did not answer." }, { status: 502 });
  }
}
