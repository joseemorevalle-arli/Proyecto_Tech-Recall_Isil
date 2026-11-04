import { questionSchema, QUIZ_QUESTIONS, type Quiz, type QuizQuestion } from "./schema.ts";

// La evidencia tiene que ser una frase de verdad, no una o dos palabras sueltas
const MIN_EVIDENCE_WORDS = 3;
const MIN_EVIDENCE_CHARS = 15;

export type SelectStats = { discarded: number; total: number };
export type SelectResult = { ok: true; quiz: Quiz; discarded: number } | { ok: false };

// Minúsculas, sin tildes, sin puntuación y con espacios colapsados (un salto de línea cuenta como espacio)
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isSupported(evidence: unknown, haystack: string): boolean {
  if (typeof evidence !== "string") return false;
  const needle = normalizeForMatch(evidence);
  if (needle.length < MIN_EVIDENCE_CHARS) return false;
  if (needle.split(" ").length < MIN_EVIDENCE_WORDS) return false;
  // Con espacios en los bordes la frase solo coincide con palabras completas
  return haystack.includes(` ${needle} `);
}

// Toma el texto crudo de la IA (con candidatas que traen `evidence`) y devuelve las PRIMERAS 10
// candidatas válidas, en orden y sin `evidence`. Una candidata inválida se descarta sola.
// Con menos de 10 válidas devuelve { ok: false } (HU11, escenario 3 y S7).
// `onStats` recibe solo conteos, nunca texto de la IA ni de la transcripción.
export function selectSupportedQuestions(
  raw: string,
  transcript: string,
  onStats?: (stats: SelectStats) => void,
): SelectResult {
  // Aunque se pide JSON puro, a veces llega dentro de una cerca de código markdown
  const body = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false };
  }

  const candidates =
    typeof data === "object" && data !== null && "questions" in data
      ? (data as { questions: unknown }).questions
      : undefined;
  if (!Array.isArray(candidates)) return { ok: false };

  const haystack = ` ${normalizeForMatch(transcript)} `;
  const seen = new Set<string>();
  const accepted: QuizQuestion[] = [];
  let discarded = 0;

  for (const candidate of candidates) {
    if (accepted.length === QUIZ_QUESTIONS) break;

    const parsed = questionSchema.safeParse(candidate);
    const evidence = (candidate as { evidence?: unknown } | null)?.evidence;
    const key = parsed.success ? parsed.data.question.trim().toLowerCase().replace(/\s+/g, " ") : "";

    if (!parsed.success || seen.has(key) || !isSupported(evidence, haystack)) {
      discarded++;
      continue;
    }
    seen.add(key);
    accepted.push(parsed.data); // el esquema descarta `evidence`
  }

  onStats?.({ discarded, total: candidates.length });

  return accepted.length === QUIZ_QUESTIONS ? { ok: true, quiz: { questions: accepted }, discarded } : { ok: false };
}
