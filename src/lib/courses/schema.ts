import { z } from "zod";

// Forma de un curso en Firestore: users/{uid}/courses/{courseId}.
// La escribe la HU06 (generación desde el sílabo) y la lee la HU07 (lista y detalle).
// Las unidades y sesiones van dentro del mismo documento: un sílabo tiene pocas y se leen de una vez.
export const courseSessionSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
});

export const courseUnitSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  sessions: z.array(courseSessionSchema).default([]),
});

export const courseSchema = z.object({
  name: z.string().min(1),
  units: z.array(courseUnitSchema).default([]),
});

export type CourseUnit = z.infer<typeof courseUnitSchema>;
export type Course = z.infer<typeof courseSchema> & { id: string };

// Total de sesiones de un curso (suma las de cada unidad)
export function countSessions(course: Course): number {
  return course.units.reduce((total, unit) => total + unit.sessions.length, 0);
}
