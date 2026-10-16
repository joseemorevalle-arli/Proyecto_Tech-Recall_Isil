"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { firstErrors, type FieldErrors } from "@/lib/auth/schemas";
import { requireSession } from "@/lib/auth/session";
import { classesCollection } from "@/lib/classes/queries";
import {
  CLASS_MESSAGES,
  classSchema,
  type ClassInput,
} from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";

export type RegisterClassState = {
  fieldErrors?: FieldErrors<ClassInput>;
  formError?: string;
};

const GENERIC_ERROR =
  "No pudimos registrar la clase. Inténtalo de nuevo en unos minutos.";

// HU08: registra una clase con el enlace de su grabación de Zoom
export async function registerClassAction(
  _prevState: RegisterClassState,
  formData: FormData,
): Promise<RegisterClassState> {
  // 1. Sesión: el uid sale de la cookie verificada, nunca del formulario
  const { uid } = await requireSession();
  const courseId = String(formData.get("courseId") ?? "");

  // 2. Validar en el servidor con el mismo esquema del formulario (no confiamos en el navegador)
  const parsed = classSchema.safeParse({
    name: formData.get("name") ?? "",
    zoomUrl: formData.get("zoomUrl") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: firstErrors(parsed.error) };
  }
  const { name, zoomUrl } = parsed.data;

  // 3. El curso tiene que estar en la cuenta del estudiante; recién entonces se guarda la clase
  let classId: string;
  try {
    const course = await getCourse(uid, courseId);
    if (!course) {
      return { formError: CLASS_MESSAGES.noAccess };
    }

    const classDoc = await classesCollection(uid, course.id).add({
      name,
      zoomUrl,
      createdAt: FieldValue.serverTimestamp(),
    });
    classId = classDoc.id;
  } catch (error) {
    console.error("Error al registrar la clase:", error);
    return { formError: GENERIC_ERROR };
  }

  // 4. Volver al curso, donde la clase ya aparece en la lista.
  // revalidatePath descarta la versión anterior del curso guardada en el navegador.
  // redirect() va fuera del try/catch porque funciona lanzando una excepción.
  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}?registrada=${classId}`);
}
