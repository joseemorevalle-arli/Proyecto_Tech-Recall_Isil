"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session";
import { getCourse } from "@/lib/courses/queries";
import { normalizeCourseEdit } from "@/lib/courses/edit";
import { adminDb } from "@/lib/firebase/admin";
import { CLASS_MESSAGES } from "@/lib/classes/schema";

export type EditCourseState = { formError?: string };

const GENERIC_ERROR = "No pudimos guardar los cambios. Inténtalo de nuevo en unos minutos.";

// CRUD de cursos: guarda el nombre, las unidades y las sesiones editados.
// Recibe el curso como JSON en un solo campo (la lista de unidades y sesiones es dinámica).
export async function editCourseAction(
  _prevState: EditCourseState,
  formData: FormData,
): Promise<EditCourseState> {
  // 1. Sesión: el uid sale de la cookie verificada, nunca del formulario
  const { uid } = await requireSession();
  const courseId = String(formData.get("courseId") ?? "");

  // 2. Validar y renumerar en el servidor (no confiamos en lo que manda el navegador)
  let input: unknown;
  try {
    input = JSON.parse(String(formData.get("course") ?? ""));
  } catch {
    return { formError: "Los datos del curso no son válidos. Revisa el formulario e inténtalo de nuevo." };
  }
  const edited = normalizeCourseEdit(input);
  if (!edited.ok) return { formError: edited.message };

  // 3. El curso tiene que estar en la cuenta del estudiante; recién entonces se actualiza.
  // Solo se cambian name y units: createdAt, sourceFile y las clases quedan como están.
  try {
    const course = await getCourse(uid, courseId);
    if (!course) return { formError: CLASS_MESSAGES.noAccess };

    await adminDb()
      .collection("users")
      .doc(uid)
      .collection("courses")
      .doc(course.id)
      .update({
        name: edited.course.name,
        units: edited.course.units,
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error("Error al editar el curso:", error instanceof Error ? error.name : "desconocido");
    return { formError: GENERIC_ERROR };
  }

  // 4. Volver al curso y descartar la versión anterior guardada en el navegador.
  // redirect() va fuera del try/catch porque funciona lanzando una excepción.
  revalidatePath("/cursos");
  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}?editado=1`);
}
