const MODEL = "gemini-flash-lite-latest";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reasonFrom(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { status?: string; message?: string } };
    return [parsed.error?.status, parsed.error?.message].filter(Boolean).join(": ").slice(0, 180);
  } catch {
    return "";
  }
}

function parseJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

export async function geminiJson(system: string, user: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("The tutor is not configured.");

  let last = "The model did not answer.";
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const detail = reasonFrom(await response.text());
      const busy = response.status === 429 || response.status === 503 || response.status === 500;
      last = busy
        ? "The model is busy right now. Wait a few seconds and try again."
        : `The model did not answer (${response.status}${detail ? `: ${detail}` : ""}).`;
      if (!busy || attempt === 3) throw new Error(last);
      await sleep(1200 * (attempt + 1));
      continue;
    }

    const data = await response.json();
    const parts = (data?.candidates?.[0]?.content?.parts || []) as { text?: string }[];
    const texts = parts.map((part) => part.text || "").filter(Boolean);
    const parsed = [texts.join(""), ...texts].map(parseJson).find((value) => value !== null);
    if (parsed !== undefined) return parsed;

    const why = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || "unreadable";
    last = why === "MAX_TOKENS" ? "The model stopped halfway through the plan. Try again." : `The model returned nothing usable (${why}).`;
    if (attempt === 3) throw new Error(last);
    await sleep(800);
  }
  throw new Error(last);
}
