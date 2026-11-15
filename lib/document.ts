import mammoth from "mammoth";
import { ensurePdfRuntime } from "@/lib/pdf-runtime";

const MAX_BYTES = 12 * 1024 * 1024;

export type Extracted = { name: string; text: string; paged: boolean };

function cleanName(name: string) {
  const base = name.split(/[/\\]/).pop() || "document";
  return base.slice(0, 120);
}

export async function extractDocument(file: File): Promise<Extracted> {
  if (file.size > MAX_BYTES) throw new Error("That file is over 12 MB. Export a shorter version and try again.");
  const name = cleanName(file.name || "document");
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "pdf" || file.type === "application/pdf") {
    ensurePdfRuntime();
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: false });
    const pages = (Array.isArray(text) ? text : [String(text)])
      .map((page, index) => `[Page ${index + 1}]\n${String(page).replace(/\s+\n/g, "\n").trim()}`)
      .filter((page) => page.replace(/\[Page \d+\]/, "").trim().length > 40);
    if (!pages.length) throw new Error("This PDF has no text we can read. A scan needs a text export first.");
    return { name, text: pages.join("\n\n"), paged: true };
  }

  if (ext === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 40) throw new Error("That document does not have enough text to build a plan.");
    return { name, text, paged: false };
  }

  if (ext === "txt" || ext === "md" || file.type.startsWith("text/")) {
    const text = buffer.toString("utf8").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 40) throw new Error("That file does not have enough text to build a plan.");
    return { name, text, paged: false };
  }

  throw new Error("Use a PDF, a Word document, or a text file.");
}
