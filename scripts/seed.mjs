import fs from "fs";
import pg from "pg";
import ts from "typescript";

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    process.env[line.slice(0, i)] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

function loadTs(path) {
  const source = fs.readFileSync(path, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const run = new Function("exports", "require", output);
  run(module.exports, () => {
    throw new Error("seed modules must not import");
  });
  return module.exports;
}

loadEnv();
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL.split("//")[1].split(".")[0];
const { books, ideas, lessons } = loadTs("content/program.ts");
const { checks } = loadTs("content/checks.ts");
const weekTitle = { 1: "How money really works", 2: "Build the system", 3: "The long game" };

const client = new pg.Client({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  user: `postgres.${ref}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: false,
});

await client.connect();
try {
  await client.query("begin");
  await client.query(fs.readFileSync("supabase/schema.sql", "utf8"));
  await client.query(`
    truncate table
      public.quiz_attempts,
      public.saved_actions,
      public.lesson_progress,
      public.checks,
      public.paragraph_cites,
      public.paragraphs,
      public.disagreements,
      public.lessons,
      public.ideas,
      public.books
    restart identity cascade
  `);

  for (let position = 0; position < books.length; position += 1) {
    const book = books[position];
    await client.query("insert into public.books (slug, title, author, color, position) values ($1, $2, $3, $4, $5)", [
      book.slug,
      book.title,
      book.author,
      book.color,
      position,
    ]);
  }

  const bookByTitle = Object.fromEntries(books.map((book) => [book.title, book.slug]));
  for (const idea of Object.values(ideas)) {
    const slug = bookByTitle[idea.book];
    if (!slug) throw new Error(`No book for ${idea.id}`);
    await client.query(
      "insert into public.ideas (id, book_slug, chapter, chapter_title, body) values ($1, $2, $3, $4, $5)",
      [idea.id, slug, idea.chapter, idea.chapterTitle, idea.text],
    );
  }

  for (const lesson of lessons) {
    await client.query(
      `insert into public.lessons (day, week, week_title, title, minutes, summary, action, questions)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        lesson.day,
        lesson.week,
        weekTitle[lesson.week],
        lesson.title,
        lesson.minutes,
        lesson.summary,
        lesson.action,
        JSON.stringify(lesson.questions),
      ],
    );
    for (let position = 0; position < lesson.paragraphs.length; position += 1) {
      const paragraph = lesson.paragraphs[position];
      const inserted = await client.query(
        "insert into public.paragraphs (lesson_day, position, body) values ($1, $2, $3) returning id",
        [lesson.day, position, paragraph.text],
      );
      const paragraphId = inserted.rows[0].id;
      for (let citeAt = 0; citeAt < paragraph.cites.length; citeAt += 1) {
        await client.query(
          "insert into public.paragraph_cites (paragraph_id, idea_id, position) values ($1, $2, $3)",
          [paragraphId, paragraph.cites[citeAt], citeAt],
        );
      }
    }
    if (lesson.disagreement) {
      const block = lesson.disagreement;
      await client.query(
        `insert into public.disagreements
          (lesson_day, a_author, a_text, a_cite, b_author, b_text, b_cite, tie)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [lesson.day, block.a.author, block.a.text, block.a.cite, block.b.author, block.b.text, block.b.cite, block.tie],
      );
    }
    const items = checks[lesson.day];
    if (!items || items.length !== 3) throw new Error(`Day ${lesson.day} needs 3 checks`);
    for (let position = 0; position < items.length; position += 1) {
      const item = items[position];
      await client.query(
        `insert into public.checks (lesson_day, position, prompt, choices, answer, idea_id)
         values ($1, $2, $3, $4::jsonb, $5, $6)`,
        [lesson.day, position, item.prompt, JSON.stringify(item.choices), item.answer, item.idea],
      );
    }
  }

  const counts = await client.query(`
    select
      (select count(*) from public.books) as books,
      (select count(*) from public.ideas) as ideas,
      (select count(*) from public.lessons) as lessons,
      (select count(*) from public.paragraphs) as paragraphs,
      (select count(*) from public.checks) as checks
  `);
  await client.query("commit");
  console.log(counts.rows[0]);
} catch (error) {
  await client.query("rollback");
  console.error(String(error.message || error).slice(0, 400));
  process.exitCode = 1;
} finally {
  await client.end();
}
