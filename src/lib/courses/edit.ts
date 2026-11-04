import { courseSchema } from "./schema.ts";

export const COURSE_NAME_MAX_LENGTH = 120;
export const COURSE_TITLE_MAX_LENGTH = 200;
export const COURSE_MAX_UNITS = 60;
export const COURSE_MAX_SESSIONS = 100;

export const COURSE_EDIT_MESSAGES = {
  invalid: "Los datos del curso no son válidos. Revisa el formulario e inténtalo de nuevo.",
  nameRequired: "Escribe el nombre del curso",
  nameTooLong: `El nombre puede tener hasta ${COURSE_NAME_MAX_LENGTH} caracteres`,
  unitTitleRequired: "Cada unidad necesita un título",
  sessionTitleRequired: "Cada sesión necesita un título",
  titleTooLong: `Los títulos pueden tener hasta ${COURSE_TITLE_MAX_LENGTH} caracteres`,
  tooManyUnits: `Un curso puede tener hasta ${COURSE_MAX_UNITS} unidades`,
  tooManySessions: `Un curso puede tener hasta ${COURSE_MAX_SESSIONS} sesiones`,
} as const;

type Course = ReturnType<typeof courseSchema.parse>;

export type CourseEditResult = { ok: true; course: Course } | { ok: false; message: string };

const fail = (message: string): CourseEditResult => ({ ok: false, message });

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

// Valida lo que manda el formulario de edición y lo deja en la forma que guarda el curso.
// El navegador solo manda títulos y el orden: los números de unidad y de sesión se calculan acá
// (la sesión sigue una numeración de corrido en todo el curso), así quitar o mover algo nunca deja huecos.
// Se copian solo los campos conocidos: lo demás que llegue (createdAt, sourceFile...) se ignora.
export function normalizeCourseEdit(input: unknown): CourseEditResult {
  const root = asRecord(input);
  if (!root || typeof root.name !== "string" || !Array.isArray(root.units)) {
    return fail(COURSE_EDIT_MESSAGES.invalid);
  }

  const name = root.name.trim();
  if (!name) return fail(COURSE_EDIT_MESSAGES.nameRequired);
  if (name.length > COURSE_NAME_MAX_LENGTH) return fail(COURSE_EDIT_MESSAGES.nameTooLong);
  if (root.units.length > COURSE_MAX_UNITS) return fail(COURSE_EDIT_MESSAGES.tooManyUnits);

  let sessionNumber = 0;
  const units = [];

  for (const [i, rawUnit] of root.units.entries()) {
    const unit = asRecord(rawUnit);
    if (!unit || typeof unit.title !== "string" || !Array.isArray(unit.sessions)) {
      return fail(COURSE_EDIT_MESSAGES.invalid);
    }

    const title = unit.title.trim();
    if (!title) return fail(COURSE_EDIT_MESSAGES.unitTitleRequired);
    if (title.length > COURSE_TITLE_MAX_LENGTH) return fail(COURSE_EDIT_MESSAGES.titleTooLong);

    const sessions = [];
    for (const rawSession of unit.sessions) {
      const session = asRecord(rawSession);
      if (!session || typeof session.title !== "string") return fail(COURSE_EDIT_MESSAGES.invalid);

      const sessionTitle = session.title.trim();
      if (!sessionTitle) return fail(COURSE_EDIT_MESSAGES.sessionTitleRequired);
      if (sessionTitle.length > COURSE_TITLE_MAX_LENGTH) return fail(COURSE_EDIT_MESSAGES.titleTooLong);

      if (++sessionNumber > COURSE_MAX_SESSIONS) return fail(COURSE_EDIT_MESSAGES.tooManySessions);
      sessions.push({ number: sessionNumber, title: sessionTitle });
    }

    units.push({ number: i + 1, title, sessions });
  }

  // El esquema del curso es la última barrera: lo que se guarda siempre lo puede leer la HU07
  const parsed = courseSchema.safeParse({ name, units });
  return parsed.success ? { ok: true, course: parsed.data } : fail(COURSE_EDIT_MESSAGES.invalid);
}
