import type { Idea } from "@/lib/course";
import { BookOpen } from "lucide-react";

export default function SourceList({ ideas, title }: { ideas: Idea[]; title: string }) {
  return (
    <section className="card source-list">
      <div className="card-title">
        <span className="tile tone-blue">
          <BookOpen size={18} aria-hidden />
        </span>
        <h2>{title}</h2>
      </div>
      {ideas.map((idea) => (
        <div key={idea.id} className="source-item">
          <span className="cover" style={{ background: idea.color }} />
          <div>
            <strong>{idea.book}</strong>
            <span>
              {idea.author} · Chapter {idea.chapter}: {idea.chapterTitle}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
