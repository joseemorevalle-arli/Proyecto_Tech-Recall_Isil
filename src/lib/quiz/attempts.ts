import { z } from "zod";
import { QUIZ_CHOICES, QUIZ_QUESTIONS } from "./schema.ts";

// HU14: un intento es una resolución completa del cuestionario de una clase.
// Se guarda en users/{uid}/quizAttempts/{attemptId}; cada intento es un documento nuevo (escenario 2).

// El navegador genera el id del intento (crypto.randomUUID): si la petición se repite, no se duplica
const ATTEMPT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// Lo que manda el navegador al terminar. El puntaje NO viene de ahí: lo calcula el servidor con el cuestionario guardado.
export const attemptInputSchema = z.object({
  courseId: z.string().min(1).max(128),
  classId: z.string().min(1).max(128),
  attemptId: z.string().regex(ATTEMPT_ID_PATTERN),
  answers: z.array(z.number().int().min(0).max(QUIZ_CHOICES - 1)).length(QUIZ_QUESTIONS),
});

export type AttemptInput = z.infer<typeof attemptInputSchema>;

// Un intento tal como se muestra en «Mi historial»
export type QuizAttempt = {
  id: string;
  courseId: string;
  classId: string;
  className: string;
  score: number;
  total: number;
  createdAt: Date;
};

export type CourseHistory = {
  courseId: string;
  courseName: string;
  attempts: QuizAttempt[];
};

// Agrupa los intentos por curso (escenario 1). Los cursos van por nombre, como en «Mis cursos»,
// y dentro de cada curso los intentos van del más reciente al más antiguo.
// `courseNames` son los nombres actuales; un intento de un curso que ya no existe se omite.
export function groupAttemptsByCourse(
  attempts: readonly QuizAttempt[],
  courseNames: ReadonlyMap<string, string>,
): CourseHistory[] {
  const groups = new Map<string, CourseHistory>();

  for (const attempt of attempts) {
    const courseName = courseNames.get(attempt.courseId);
    if (courseName === undefined) continue;

    let group = groups.get(attempt.courseId);
    if (!group) {
      group = { courseId: attempt.courseId, courseName, attempts: [] };
      groups.set(attempt.courseId, group);
    }
    group.attempts.push(attempt);
  }

  for (const group of groups.values()) {
    group.attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return [...groups.values()].sort((a, b) => a.courseName.localeCompare(b.courseName, "es"));
}
