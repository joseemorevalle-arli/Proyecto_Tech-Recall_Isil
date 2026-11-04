import { MAX_VTT_BYTES } from "./client.ts";
import { countCues } from "./vtt.ts";

// HU17: carga manual de la transcripción. Solo .vtt (subtítulos de Zoom) o .txt (texto plano).
export const MANUAL_TRANSCRIPT_EXTENSIONS = ["vtt", "txt"] as const;
export const MANUAL_TRANSCRIPT_ACCEPT = ".vtt,.txt";

// Mismo límite que la transcripción automática: se guarda en el documento de la clase (Firestore: 1 MiB)
export const MAX_MANUAL_TRANSCRIPT_BYTES = MAX_VTT_BYTES;

// Menos que esto no alcanza para un resumen ni para 10 preguntas
const MIN_TEXT_CHARS = 200;

export const MANUAL_TRANSCRIPT_MESSAGES = {
  noFile: "Elige un archivo .vtt o .txt con la transcripción.",
  invalidFormat: "Formato no permitido. Solo se aceptan archivos .vtt o .txt.",
  empty: "El archivo está vacío. Elige un archivo con la transcripción de la clase.",
  tooLarge: "El archivo supera los 800 KB permitidos.",
  unreadable: "No pudimos leer el archivo. Guárdalo como texto (UTF-8) e inténtalo de nuevo.",
  vttWithoutCues: "El archivo .vtt no tiene el formato de una transcripción (faltan las líneas de tiempo).",
  tooShort: "La transcripción es demasiado corta para generar un resumen o un cuestionario.",
} as const;

export type ManualTranscriptResult =
  | { ok: true; transcript: string; format: "vtt" | "txt" }
  | { ok: false; message: string };

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

// Valida el archivo subido y devuelve su texto listo para guardar. Nunca lanza.
// Un archivo que no pasa (escenario 2) devuelve el mensaje de error y no se asocia a la clase.
export function validateManualTranscript(fileName: string, bytes: Uint8Array): ManualTranscriptResult {
  const extension = extensionOf(fileName);
  if (!(MANUAL_TRANSCRIPT_EXTENSIONS as readonly string[]).includes(extension)) {
    return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.invalidFormat };
  }
  if (bytes.byteLength === 0) return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.empty };
  if (bytes.byteLength > MAX_MANUAL_TRANSCRIPT_BYTES) {
    return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.tooLarge };
  }

  // fatal: true rechaza lo que no es UTF-8 válido (un PDF o un .docx renombrado, por ejemplo)
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.unreadable };
  }
  // Un archivo de texto no trae caracteres nulos; un binario sí
  if (text.includes("\u0000")) return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.unreadable };

  text = text.replace(/^\uFEFF/, ""); // marca BOM que agregan algunos editores de Windows
  if (text.trim() === "") return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.empty };

  if (extension === "vtt") {
    if (!text.trimStart().startsWith("WEBVTT") || countCues(text) === 0) {
      return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.vttWithoutCues };
    }
  }

  // Lo que importa es lo que se dijo, sin tiempos ni espacios
  const spoken = text
    .split(/\r?\n/)
    .filter((row) => !/-->/.test(row) && !/^\s*(WEBVTT|\d+)\s*$/.test(row))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (spoken.length < MIN_TEXT_CHARS) return { ok: false, message: MANUAL_TRANSCRIPT_MESSAGES.tooShort };

  return { ok: true, transcript: text, format: extension === "vtt" ? "vtt" : "txt" };
}
