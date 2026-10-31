import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

// Forma de una clase guardada en users/{uid}/courses/{courseId}/classes/{classId}.
// Al leer no se repite la validación del enlace: si la regla cambia, las clases antiguas se siguen mostrando.
const storedClassSchema = z.object({
  name: z.string().min(1),
  zoomUrl: z.string().min(1),
  createdAt: z.instanceof(Timestamp).transform((timestamp) => timestamp.toDate()),
  // HU09: fecha en que se guardó la transcripción. El texto (transcript) no se lee aquí: puede pesar
  // cientos de KB y la lista de clases solo necesita saber si ya existe.
  transcribedAt: z
    .instanceof(Timestamp)
    .transform((timestamp) => timestamp.toDate())
    .optional(),
});

// Campos que se leen de cada clase (todos menos la transcripción)
const LISTED_FIELDS = ["name", "zoomUrl", "createdAt", "transcribedAt"] as const;

export type CourseClass = z.output<typeof storedClassSchema> & { id: string };

// Siempre se parte del uid de la sesión. Antes de usarla, getCourse(uid, courseId) debe haber
// confirmado que el curso existe en la cuenta del estudiante (así también se valida el courseId).
export function classesCollection(uid: string, courseId: string) {
  return adminDb()
    .collection("users")
    .doc(uid)
    .collection("courses")
    .doc(courseId)
    .collection("classes");
}

// IDs de documento válidos (los de Firestore son 20 letras y números). Evita enlaces con "/" o "..".
const CLASS_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Una clase del curso, o null si no existe. Igual que getCourse: antes hay que haber confirmado
// con getCourse(uid, courseId) que el curso es del estudiante.
export async function getClass(
  uid: string,
  courseId: string,
  classId: string,
): Promise<CourseClass | null> {
  if (!CLASS_ID_PATTERN.test(classId)) return null;

  const doc = await classesCollection(uid, courseId).doc(classId).get();
  if (!doc.exists) return null;
  // El texto de la transcripción queda fuera del objeto: lo usarán las HU de resumen y cuestionario

  const parsed = storedClassSchema.safeParse(doc.data());
  return parsed.success ? { id: doc.id, ...parsed.data } : null;
}

// Clases del curso, de la más reciente a la más antigua. Un documento con formato inválido se omite (y se registra).
export async function listClasses(
  uid: string,
  courseId: string,
): Promise<CourseClass[]> {
  const snapshot = await classesCollection(uid, courseId)
    .orderBy("createdAt", "desc")
    .select(...LISTED_FIELDS)
    .get();

  const classes: CourseClass[] = [];
  for (const doc of snapshot.docs) {
    const parsed = storedClassSchema.safeParse(doc.data());
    if (parsed.success) {
      classes.push({ id: doc.id, ...parsed.data });
    } else {
      console.error(`Clase con formato inválido (${doc.ref.path}):`, parsed.error);
    }
  }

  return classes;
}
