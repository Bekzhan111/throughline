import SiteHeader from "@/components/SiteHeader";
import { lessonIdeaIds, loadCourse, type Course } from "@/lib/course";
import { BookMarked, BookOpen, Library } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let course: Course | null = null;
  try {
    course = await loadCourse();
  } catch {
    course = null;
  }

  if (!course) {
    return (
      <>
        <SiteHeader />
        <main className="shell">
          <p className="lede">The library could not be loaded. Reload the page to try again.</p>
        </main>
      </>
    );
  }

  const daysByIdea: Record<string, number[]> = {};
  for (const lesson of course.lessons) {
    for (const id of lessonIdeaIds(lesson)) (daysByIdea[id] ||= []).push(lesson.day);
  }
  const ideas = Object.values(course.ideas);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <div className="kicker">LIBRARY</div>
        <h1 className="page-title">The books behind the program</h1>
        <p className="lede page-lede">
          The notes are written in our own words, so the library holds the trail back to each chapter and not the text of the book. Each note
          lists the lessons that use it.
        </p>
        <div className="chips library-counts">
          <span className="tag tone-blue">
            <Library size={14} aria-hidden />
            {course.books.length} books
          </span>
          <span className="tag tone-purple">
            <BookMarked size={14} aria-hidden />
            {ideas.length} chapter notes
          </span>
        </div>

        <div className="library">
          {course.books.map((book) => {
            const notes = ideas.filter((idea) => idea.book === book.title).sort((a, b) => a.chapter - b.chapter);
            return (
              <section key={book.slug} className="card book-card">
                <div className="book-head">
                  <div className="cover big" style={{ background: book.color }}>
                    <BookOpen size={22} aria-hidden />
                  </div>
                  <div>
                    <h2>{book.title}</h2>
                    <span>
                      {book.author} · {notes.length} {notes.length === 1 ? "chapter note" : "chapter notes"}
                    </span>
                  </div>
                </div>
                {notes.map((idea) => (
                  <div key={idea.id} className="note" style={{ borderColor: book.color }}>
                    <div className="note-title">
                      Chapter {idea.chapter}: {idea.chapterTitle}
                    </div>
                    <p>{idea.text}</p>
                    <div className="note-days">
                      <span>Used in</span>
                      {(daysByIdea[idea.id] || []).map((day) => (
                        <Link key={day} href={`/lesson/${day}`}>
                          Day {day}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
