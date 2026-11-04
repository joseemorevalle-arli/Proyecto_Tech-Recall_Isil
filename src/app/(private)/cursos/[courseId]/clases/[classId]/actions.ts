"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { firstErrors } from "@/lib/auth/schemas";
import { requireSession } from "@/lib/auth/session";
import { classesCollection, getClass } from "@/lib/classes/queries";
import { CLASS_MESSAGES, classSchema } from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";
import { deleteAttempts } from "@/lib/quiz/attempt-queries";
import {
  fetchTranscript,
  TRANSCRIPT_MESSAGES,
  transcriptionConfigFromEnv,
} from "@/lib/transcription/client";
import { MANUAL_TRANSCRIPT_MESSAGES, validateManualTranscript } from "@/lib/transcription/manual";
import type { RegisterClassState } from "../nueva/actions";

export type DeleteClassState = { formError?: string };

// HU09: resultado de procesar una clase. "done" = transcripción guardada; "no-transcript" = escenario 3;
// "error" = escenario 2 (el estudiante puede reintentar: la clase conserva su nombre y su enlace).
export type ProcessClassState = {
  status?: "done" | "no-transcript" | "error";
  message?: string;
};

const PROCESS_GENERIC_ERROR =
  "No pudimos guardar la transcripción. Inténtalo de nuevo en unos minutos.";

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

// HU09: obtiene la transcripción de la grabación y la guarda en la clase.
// El enlace de Zoom sale de la clase guardada (nunca del formulario) y la clase tiene que ser del estudiante.
export async function processClassAction(
  _prevState: ProcessClassState,
  formData: FormData,
): Promise<ProcessClassState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  let own: Awaited<ReturnType<typeof ownClass>>;
  try {
    own = await ownClass(courseId, classId);
  } catch (error) {
    console.error("Error al buscar la clase a procesar:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: PROCESS_GENERIC_ERROR };
  }
  if ("error" in own) return { status: "error", message: own.error };

  const result = await fetchTranscript(own.found.zoomUrl, transcriptionConfigFromEnv());
  if (result.status === "no-transcript") {
    return { status: "no-transcript", message: TRANSCRIPT_MESSAGES.noTranscript };
  }
  if (result.status === "error") return { status: "error", message: result.message };

  try {
    await classesCollection(own.uid, own.course.id)
      .doc(own.found.id)
      .update({
        transcript: result.vtt,
        transcriptSource: "zoom",
        transcribedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error("Error al guardar la transcripción:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: PROCESS_GENERIC_ERROR };
  }

  // La lista del curso y el detalle de la clase muestran el nuevo estado («transcripción lista»)
  revalidatePath(`/cursos/${courseId}`);
  revalidatePath(`/cursos/${courseId}/clases/${classId}`);
  return { status: "done" };
}

// HU17: resultado de subir la transcripción a mano
export type UploadTranscriptState = { status?: "done" | "error"; message?: string };

// HU17: el estudiante sube la transcripción (.vtt o .txt) cuando no se pudo obtener desde Zoom.
// Se valida en el servidor aunque el formulario ya lo haya hecho; si no pasa, no se asocia nada a la clase.
export async function uploadTranscriptAction(
  _prevState: UploadTranscriptState,
  formData: FormData,
): Promise<UploadTranscriptState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const file = formData.get("transcript");

  let own: Awaited<ReturnType<typeof ownClass>>;
  try {
    own = await ownClass(courseId, classId);
  } catch (error) {
    console.error("Error al buscar la clase:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: PROCESS_GENERIC_ERROR };
  }
  if ("error" in own) return { status: "error", message: own.error };

  // Una clase que ya tiene transcripción no se reemplaza: su resumen y su cuestionario salieron de ella
  if (own.found.transcribedAt) {
    return { status: "error", message: "Esta clase ya tiene transcripción." };
  }

  if (!(file instanceof File) || file.name === "") {
    return { status: "error", message: MANUAL_TRANSCRIPT_MESSAGES.noFile };
  }
  const validation = validateManualTranscript(file.name, new Uint8Array(await file.arrayBuffer()));
  if (!validation.ok) return { status: "error", message: validation.message };

  try {
    await classesCollection(own.uid, own.course.id)
      .doc(own.found.id)
      .update({
        transcript: validation.transcript,
        transcriptSource: "manual",
        transcribedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error("Error al guardar la transcripción subida:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: PROCESS_GENERIC_ERROR };
  }

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath(`/cursos/${courseId}/clases/${classId}`);
  return { status: "done" };
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
    // HU14: los intentos de su cuestionario también se borran del historial
    await deleteAttempts(own.uid, "classId", own.found.id);
  } catch (error) {
    console.error("Error al eliminar la clase:", error instanceof Error ? error.name : "desconocido");
    return { formError: "No pudimos eliminar la clase. Inténtalo de nuevo en unos minutos." };
  }

  revalidatePath(`/cursos/${courseId}`);
  redirect(`/cursos/${courseId}?clase-eliminada=1`);
}
