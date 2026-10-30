"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { CLASS_MESSAGES } from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";
import { adminDb } from "@/lib/firebase/admin";

export type DeleteCourseState = { formError?: string };

const GENERIC_ERROR = "No pudimos eliminar el curso. Inténtalo de nuevo en unos minutos.";

// CRUD de cursos: elimina un curso y todas sus clases. No se puede deshacer.
// La confirmación la pide la pantalla; acá se comprueba que el curso sea del estudiante.
export async function deleteCourseAction(
  _prevState: DeleteCourseState,
  formData: FormData,
): Promise<DeleteCourseState> {
  // 1. Sesión: el uid sale de la cookie verificada, nunca del formulario
  const { uid } = await requireSession();
  const courseId = String(formData.get("courseId") ?? "");

  try {
    // 2. El curso tiene que estar en la cuenta del estudiante (esto también valida el courseId).
    // El de otro estudiante responde igual que uno inexistente, sin revelar que existe.
    const course = await getCourse(uid, courseId);
    if (!course) return { formError: CLASS_MESSAGES.noAccess };

    // 3. Borra el curso y su subcolección de clases. Firestore no borra las subcolecciones solo:
    // un delete() simple dejaría las clases huérfanas, sin forma de verlas ni de borrarlas después.
    const db = adminDb();
    await db.recursiveDelete(db.collection("users").doc(uid).collection("courses").doc(course.id));
  } catch (error) {
    console.error("Error al eliminar el curso:", error instanceof Error ? error.name : "desconocido");
    return { formError: GENERIC_ERROR };
  }

  // 4. Volver a «Mis cursos». redirect() va fuera del try/catch porque funciona lanzando una excepción.
  revalidatePath("/cursos");
  redirect("/cursos?eliminado=1");
}
