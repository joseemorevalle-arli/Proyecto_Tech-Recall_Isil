import { normalizeForMatch } from "../quiz/select-supported-questions.ts";
import { MAX_TOPICS, topicSchema, type Summary, type SummaryTopic } from "./schema.ts";

// La evidencia tiene que ser una frase de verdad, no una o dos palabras sueltas (igual que en la HU11)
const MIN_EVIDENCE_WORDS = 3;
const MIN_EVIDENCE_CHARS = 15;

export type SelectTopicsStats = { discarded: number; total: number };
export type SelectTopicsResult = { ok: true; summary: Summary; discarded: number } | { ok: false };

function isSupported(evidence: string, haystack: string): boolean {
  const needle = normalizeForMatch(evidence);
  if (needle.length < MIN_EVIDENCE_CHARS) return false;
  if (needle.split(" ").length < MIN_EVIDENCE_WORDS) return false;
  // Con espacios en los bordes la frase solo coincide con palabras completas
  return haystack.includes(` ${needle} `);
}

// HU10, escenario 2 («no agrega temas que no se dictaron»): toma la respuesta cruda de la IA y deja
// solo los temas cuya frase de respaldo aparece en la transcripción. Si se descarta más de la mitad,
// la respuesta no es confiable y cuenta como intento fallido. `onStats` recibe solo conteos.
export function selectSupportedTopics(
  raw: string,
  transcript: string,
  onStats?: (stats: SelectTopicsStats) => void,
): SelectTopicsResult {
  // Aunque se pide JSON puro, a veces llega dentro de una cerca de código markdown
  const body = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false };
  }

  const candidates =
    typeof data === "object" && data !== null && "topics" in data
      ? (data as { topics: unknown }).topics
      : undefined;
  if (!Array.isArray(candidates) || candidates.length === 0) return { ok: false };

  const haystack = ` ${normalizeForMatch(transcript)} `;
  const seen = new Set<string>();
  const accepted: SummaryTopic[] = [];
  let discarded = 0;

  for (const candidate of candidates) {
    const parsed = topicSchema.safeParse(candidate);
    const key = parsed.success ? normalizeForMatch(parsed.data.title) : "";

    if (!parsed.success || seen.has(key) || !isSupported(parsed.data.evidence, haystack)) {
      discarded++;
      continue;
    }
    seen.add(key);
    accepted.push(parsed.data);
  }

  onStats?.({ discarded, total: candidates.length });

  if (accepted.length === 0 || discarded * 2 > candidates.length) return { ok: false };
  return { ok: true, summary: { topics: accepted.slice(0, MAX_TOPICS) }, discarded };
}
