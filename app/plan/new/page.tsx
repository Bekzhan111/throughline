"use client";

import SiteHeader from "@/components/SiteHeader";
import { getSupabase } from "@/lib/supabase";
import { ArrowRight, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewPlanPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/plan/new");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function build() {
    if (!file || goal.trim().length < 8 || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login?next=/plan/new");
        return;
      }
      const form = new FormData();
      form.set("goal", goal.trim());
      form.set("file", file);
      const response = await fetch("/api/plan", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The plan could not be built.");
      router.push(`/plan/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The plan could not be built.");
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="shell start-grid">
        <section>
          <div className="kicker">YOUR DOCUMENT</div>
          <h1 className="page-title">What do you want to learn from it?</h1>
          <p className="lede page-lede">
            Upload a file you already have. We read it once, build a plan around your goal, and save the plan. The file is not kept, so later lessons do not upload it again.
          </p>
          {!ready ? (
            <p className="lede">Loading…</p>
          ) : (
            <>
              <label className="goal-field">
                Your goal
                <textarea
                  value={goal}
                  placeholder="Example: I want to learn how to pay off a card without a budget I will quit."
                  onChange={(event) => setGoal(event.target.value)}
                />
              </label>
              <label className="filebox">
                <span className="tile big tone-purple">
                  {file ? <FileText size={26} aria-hidden /> : <Upload size={26} aria-hidden />}
                </span>
                <span>
                  <strong>{file ? file.name : "Choose a PDF, Word, or text file"}</strong>
                  <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : "Up to 12 MB"}</span>
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </>
          )}
        </section>
        <aside className="card preview-card">
          <div className="kicker">WHAT GETS SAVED</div>
          <h2>A plan sized to the goal</h2>
          <p className="hint">A narrow goal becomes a few lessons. A wider one becomes more. It is not locked to 21 days.</p>
          <ul className="preview-books">
            <li className="more">The summary of the document, in our words</li>
            <li className="more">The lessons, each pointing at a page or section</li>
            <li className="more">Your scores and actions, on this account</li>
          </ul>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary big block" disabled={!ready || busy || !file || goal.trim().length < 8} onClick={build}>
            {busy ? "Building your plan…" : "Build my plan"}
            {!busy && <ArrowRight size={18} aria-hidden />}
          </button>
          {busy && <p className="hint">This runs once. You can leave this tab open.</p>}
        </aside>
      </main>
    </>
  );
}
