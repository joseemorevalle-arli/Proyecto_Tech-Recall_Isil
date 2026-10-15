import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { courseSchema, type Course } from "./schema";

// IDs de documento válidos (los que genera Firestore son 20 letras y números).
// Evita que un enlace manipulado con "/" o ".." apunte a otra ruta de Firestore.
const COURSE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Siempre se parte del uid de la sesión: un estudiante solo puede leer sus propios cursos
function coursesCollection(uid: string) {
  return adminDb().collection("users").doc(uid).collection("courses");
}

// Cursos del estudiante ordenados por nombre. Un documento con formato inválido se omite (y se registra).
export async function listCourses(uid: string): Promise<Course[]> {
  const snapshot = await coursesCollection(uid).get();

  const courses: Course[] = [];
  for (const doc of snapshot.docs) {
    const parsed = courseSchema.safeParse(doc.data());
    if (parsed.success) {
      courses.push({ id: doc.id, ...parsed.data });
    } else {
      console.error(`Curso con formato inválido (${doc.ref.path}):`, parsed.error);
    }
  }

  return courses.sort((a, b) => a.name.localeCompare(b.name, "es"));
}

// Busca el curso solo dentro de users/{uid}. Si es de otro estudiante (o no existe) devuelve null:
// así no se revela si el curso existe en otra cuenta.
export async function getCourse(
  uid: string,
  courseId: string,
): Promise<Course | null> {
  if (!COURSE_ID_PATTERN.test(courseId)) return null;

  const doc = await coursesCollection(uid).doc(courseId).get();
  if (!doc.exists) return null;

  return { id: doc.id, ...courseSchema.parse(doc.data()) };
}
