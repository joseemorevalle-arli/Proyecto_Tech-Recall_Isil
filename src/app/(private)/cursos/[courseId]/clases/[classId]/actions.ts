"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { firstErrors } from "@/lib/auth/schemas";
import { requireSession } from "@/lib/auth/session";
import { classesCollection, getClass } from "@/lib/classes/queries";
import { CLASS_MESSAGES, classSchema } from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";
import type { RegisterClassState } from "../nueva/actions";

export type DeleteClassState = { formError?: string };

const CLASS_NOT_FOUND = "No encontramos esa clase. Puede que ya la hayas eliminado.";

// Sesión + curso del estudiante + clase del curso. Devuelve null si algo no es suyo o no existe.
async function ownClass(courseId: string, classId: string) {
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);
  if (!course) return { uid, error: CLASS_MESSAGES.noAccess } as const;
  const found = await getClass(uid, course.id, classId);
  if (!found) return { uid, error: CLASS_NOT_FOUND } as const;
  return { uid, course, found } as const;
}

// CRUD de clases: edita el nombre y el enlace de Zoom con las mismas reglas del registro (HU08)
export async function editClassAction(
  _prevState: RegisterClassState,
  formData: FormData,
): Promise<RegisterClassState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  // Se valida primero lo escrito; no hace falta consultar la base si ya viene mal
  const parsed = classSchema.safeParse({
    name: formData.get("name") ?? "",
    zoomUrl: formData.get("zoomUrl") ?? "",
  });

  // Aunque el formulario sea inválido, la sesión se exige igual (sin sesión redirige a iniciar sesión)
  const { uid } = await requireSession();
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  try {
    const own = await ownClass(courseId, classId);
    if ("error" in own) return { formError: own.error };

    await classesCollection(uid, own.course.id)
      .doc(own.found.id)
      .update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("Error al editar la clase:", error instanceof Error ? error.name : "desconocido");
    return { formError: "No pudimos guardar los cambios. Inténtalo de nuevo en unos minutos." };
  }

  // redirect() va fuera del try/catch porque funciona lanzando una excepción
  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}?clase-editada=${classId}`);
}

// CRUD de clases: elimina una clase. No se puede deshacer; la pantalla pide confirmación antes.
export async function deleteClassAction(
  _prevState: DeleteClassState,
  formData: FormData,
): Promise<DeleteClassState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  try {
    const own = await ownClass(courseId, classId);
    if ("error" in own) return { formError: own.error };

    await classesCollection(own.uid, own.course.id).doc(own.found.id).delete();
  } catch (error) {
    console.error("Error al eliminar la clase:", error instanceof Error ? error.name : "desconocido");
    return { formError: "No pudimos eliminar la clase. Inténtalo de nuevo en unos minutos." };
  }

  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}?clase-eliminada=1`);
}
