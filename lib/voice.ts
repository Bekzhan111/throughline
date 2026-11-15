const PREFERRED = ["Google US English", "Samantha", "Karen", "Moira", "Daniel"];

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      const list = synth.getVoices();
      if (!list.length) return;
      synth.removeEventListener("voiceschanged", done);
      resolve(list);
    };
    synth.addEventListener("voiceschanged", done);
    window.setTimeout(() => resolve(synth.getVoices()), 1500);
  });
}

export async function makeUtterance(text: string) {
  const voices = await loadVoices();
  const voice =
    PREFERRED.map((name) => voices.find((item) => item.name === name)).find((item) => item) ||
    voices.find((item) => item.lang === "en-US" && !/alex|fred|albert/i.test(item.name));
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  if (voice) utterance.voice = voice;
  return utterance;
}

export async function speakSequence(
  parts: string[],
  options: { alive: () => boolean; onPart: (index: number) => void; onDone: () => void },
) {
  const synth = window.speechSynthesis;
  const step = async (index: number) => {
    if (!options.alive()) return;
    if (index >= parts.length) {
      options.onDone();
      return;
    }
    const text = parts[index].trim();
    if (!text) {
      void step(index + 1);
      return;
    }
    options.onPart(index);
    const item = await makeUtterance(text);
    if (!options.alive()) return;
    let moved = false;
    const next = () => {
      if (moved || !options.alive()) return;
      moved = true;
      window.setTimeout(() => void step(index + 1), 40);
    };
    item.onend = next;
    item.onerror = (event) => {
      if (!options.alive()) return;
      if (event.error === "interrupted" || event.error === "canceled") return;
      options.onDone();
    };
    synth.resume();
    synth.speak(item);
  };
  await step(0);
}
