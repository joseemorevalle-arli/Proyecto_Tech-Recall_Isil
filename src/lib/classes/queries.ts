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
});

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

// Clases del curso, de la más reciente a la más antigua. Un documento con formato inválido se omite (y se registra).
export async function listClasses(
  uid: string,
  courseId: string,
): Promise<CourseClass[]> {
  const snapshot = await classesCollection(uid, courseId)
    .orderBy("createdAt", "desc")
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
