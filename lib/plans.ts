import { getSupabase } from "@/lib/supabase";
import { computeStats, streakFrom, XP, type Mine, type Stats } from "@/lib/course";

export type PlanParagraph = { text: string; source: string };
export type PlanCheck = { prompt: string; choices: string[]; answer: number; source: string; note: string };
export type PlanQuestion = string;

export type PlanLesson = {
  id: string;
  position: number;
  title: string;
  minutes: number;
  summary: string;
  paragraphs: PlanParagraph[];
  action: string;
  questions: string[];
  checks: PlanCheck[];
};

export type Plan = {
  id: string;
  title: string;
  goal: string;
  summary: string;
  sourceName: string;
  lessons: PlanLesson[];
};

export type PlanAttempt = {
  lesson_id: string;
  score: number;
  total: number;
  missed: { prompt: string; note: string; source: string }[];
  created_at: string;
};

export type PlanMine = {
  completed: string[];
  actions: Record<string, string>;
  attempts: PlanAttempt[];
};

export type PlanCard = {
  id: string;
  title: string;
  goal: string;
  sourceName: string;
  done: number;
  total: number;
  stars: number;
  maxStars: number;
};

export type PlanActivity = { completed: number; actions: number; attempts: { lesson_id: string; score: number; created_at: string }[] };

const EMPTY_ACTIVITY: PlanActivity = { completed: 0, actions: 0, attempts: [] };

function asLessons(rows: Record<string, unknown>[]): PlanLesson[] {
  return rows
    .map((row) => ({
      id: String(row.id),
      position: Number(row.position),
      title: String(row.title),
      minutes: Number(row.minutes),
      summary: String(row.summary),
      paragraphs: (row.paragraphs || []) as PlanParagraph[],
      action: String(row.action),
      questions: (row.questions || []) as string[],
      checks: (row.checks || []) as PlanCheck[],
    }))
    .sort((a, b) => a.position - b.position);
}

export async function loadPlan(planId: string): Promise<{ plan: Plan; mine: PlanMine } | null> {
  const supabase = getSupabase();
  const planRow = await supabase.from("plans").select("id, title, goal, summary, source_name").eq("id", planId).maybeSingle();
  if (planRow.error) throw new Error(planRow.error.message);
  if (!planRow.data) return null;
  const lessons = await supabase.from("plan_lessons").select("id, position, title, minutes, summary, paragraphs, action, questions, checks").eq("plan_id", planId);
  if (lessons.error) throw new Error(lessons.error.message);
  const ids = (lessons.data || []).map((row) => row.id as string);
  const [progress, actions, attempts] = await Promise.all([
    ids.length ? supabase.from("plan_progress").select("lesson_id").in("lesson_id", ids) : Promise.resolve({ data: [], error: null }),
    ids.length ? supabase.from("plan_actions").select("lesson_id, body").in("lesson_id", ids) : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase.from("plan_attempts").select("lesson_id, score, total, missed, created_at").in("lesson_id", ids).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [progress, actions, attempts].find((item) => item.error);
  if (failed?.error) throw new Error(failed.error.message);
  return {
    plan: {
      id: planRow.data.id,
      title: planRow.data.title,
      goal: planRow.data.goal,
      summary: planRow.data.summary,
      sourceName: planRow.data.source_name,
      lessons: asLessons(lessons.data || []),
    },
    mine: {
      completed: (progress.data || []).map((row) => row.lesson_id as string),
      actions: Object.fromEntries((actions.data || []).map((row) => [row.lesson_id as string, row.body as string])),
      attempts: (attempts.data || []) as PlanAttempt[],
    },
  };
}

export async function loadPlanCards(userId: string): Promise<PlanCard[]> {
  const supabase = getSupabase();
  const plans = await supabase.from("plans").select("id, title, goal, source_name, created_at").eq("user_id", userId).order("created_at", { ascending: false });
  if (plans.error) return [];
  const ids = (plans.data || []).map((row) => row.id as string);
  if (!ids.length) return [];
  const [lessons, attempts] = await Promise.all([
    supabase.from("plan_lessons").select("id, plan_id, checks").in("plan_id", ids),
    supabase.from("plan_attempts").select("lesson_id, score").eq("user_id", userId),
  ]);
  if (lessons.error || attempts.error) return [];
  const best: Record<string, number> = {};
  for (const attempt of attempts.data || []) {
    const lessonId = attempt.lesson_id as string;
    best[lessonId] = Math.max(best[lessonId] ?? 0, attempt.score as number);
  }
  return (plans.data || []).map((plan) => {
    const rows = (lessons.data || []).filter((row) => row.plan_id === plan.id);
    return {
      id: plan.id as string,
      title: plan.title as string,
      goal: (plan.goal as string) || "",
      sourceName: plan.source_name as string,
      total: rows.length,
      done: rows.filter((row) => (best[row.id as string] ?? 0) >= 1).length,
      stars: rows.reduce((sum, row) => sum + (best[row.id as string] ?? 0), 0),
      maxStars: rows.reduce((sum, row) => sum + ((row.checks as unknown[])?.length || 0), 0),
    };
  });
}

export async function loadPlanActivity(userId: string): Promise<PlanActivity> {
  const supabase = getSupabase();
  const [progress, actions, attempts] = await Promise.all([
    supabase.from("plan_progress").select("lesson_id").eq("user_id", userId),
    supabase.from("plan_actions").select("lesson_id").eq("user_id", userId),
    supabase.from("plan_attempts").select("lesson_id, score, created_at").eq("user_id", userId),
  ]);
  if (progress.error || actions.error || attempts.error) return EMPTY_ACTIVITY;
  return {
    completed: (progress.data || []).length,
    actions: (actions.data || []).length,
    attempts: (attempts.data || []) as PlanActivity["attempts"],
  };
}

export function mergeStats(mine: Mine, plan: PlanActivity): Stats {
  const course = computeStats(mine);
  const best: Record<string, number> = {};
  for (const attempt of plan.attempts) best[attempt.lesson_id] = Math.max(best[attempt.lesson_id] ?? 0, attempt.score);
  const stars = Object.values(best).reduce((sum, score) => sum + score, 0);
  const xp = plan.completed * XP.lesson + stars * XP.correct + plan.actions * XP.action;
  const dates = [...mine.attempts.map((attempt) => attempt.created_at), ...plan.attempts.map((attempt) => attempt.created_at)];
  return { xp: course.xp + xp, stars: course.stars + stars, streak: streakFrom(dates), best: course.best };
}

export async function completePlanLesson(userId: string, lessonId: string) {
  const { error } = await getSupabase()
    .from("plan_progress")
    .upsert({ user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function savePlanAction(userId: string, lessonId: string, body: string) {
  const { error } = await getSupabase()
    .from("plan_actions")
    .upsert({ user_id: userId, lesson_id: lessonId, body, updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
  if (error) throw new Error(error.message);
}

export async function savePlanAttempt(
  userId: string,
  lessonId: string,
  score: number,
  total: number,
  missed: { prompt: string; note: string; source: string }[],
) {
  const { error } = await getSupabase().from("plan_attempts").insert({ user_id: userId, lesson_id: lessonId, score, total, missed });
  if (error) throw new Error(error.message);
}
