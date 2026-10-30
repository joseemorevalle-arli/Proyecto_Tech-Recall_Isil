import { courseSchema } from "../courses/schema.ts";

type Course = ReturnType<typeof courseSchema.parse>;

export type MapResult = { ok: true; course: Course } | { ok: false };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// La pantalla ya muestra «Unidad N» y «Sesión N», y Gemini a veces copia ese prefijo del sílabo.
// Solo se quita cuando va seguido de número y separador, para no tocar «Unidades de medida».
function stripPrefix(title: string, word: "unidad" | "sesi[oó]n"): string {
  const prefix = new RegExp(`^${word}\\s*\\d+\\s*[:.\\-–—]\\s*`, "i");
  return title.replace(prefix, "").trim() || title;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

// Convierte el JSON que devuelve Gemini a la forma del curso que lee la HU07 (courses/schema.ts).
// No confía en la numeración del modelo: las unidades se numeran en orden y las sesiones siguen
// una numeración global a lo largo del curso (la sesión 3 puede estar en la unidad 2).
export function mapGeminiCourse(raw: string): MapResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false };
  }

  const root = asRecord(data);
  const name = text(root?.title);
  if (!root || !name || !Array.isArray(root.content)) return { ok: false };

  const units = root.content.flatMap((rawUnit) => {
    const unit = asRecord(rawUnit);
    const title = stripPrefix(text(unit?.title), "unidad");
    if (!unit || !title) return [];

    const sessions = (Array.isArray(unit.sesiones) ? unit.sesiones : []).flatMap((rawSession) => {
      const session = asRecord(rawSession);
      // El tema es el contenido conceptual; si falta, sirve la descripción de la sesión
      const sessionTitle = stripPrefix(text(session?.tema) || text(session?.descripcion), "sesi[oó]n");
      return sessionTitle ? [sessionTitle] : [];
    });

    return [{ title, sessions }];
  });

  let sessionNumber = 0;
  const parsed = courseSchema.safeParse({
    name,
    units: units.map((unit, i) => ({
      number: i + 1,
      title: unit.title,
      sessions: unit.sessions.map((title) => ({ number: ++sessionNumber, title })),
    })),
  });

  if (!parsed.success || parsed.data.units.length === 0) return { ok: false };
  return { ok: true, course: parsed.data };
}
