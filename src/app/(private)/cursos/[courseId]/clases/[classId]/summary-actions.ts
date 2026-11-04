"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session";
import { isEmailVerified, VERIFICATION_MESSAGES } from "@/lib/auth/verification";
import { classesCollection, getClassContent } from "@/lib/classes/queries";
import { CLASS_MESSAGES } from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";
import { generateSummary } from "@/lib/summary/generate-summary";
import { transcriptToPlainText } from "@/lib/transcription/text";
import type { GeminiClient } from "@/lib/syllabus/generate-course";

// Mensajes que ve el estudiante. No se exporta: un archivo "use server" solo puede exportar funciones async.
const SUMMARY_MESSAGES = {
  noTranscript: "Esta clase todavía no tiene transcripción. Obtén o sube la transcripción primero.",
  generateFailed: "No pudimos generar el resumen. Inténtalo de nuevo en unos minutos.",
  notFound: "No encontramos esa clase. Puede que ya la hayas eliminado.",
} as const;

export type GenerateSummaryState = { status?: "done" | "error"; message?: string };

// HU10: genera el resumen por temas a partir de la transcripción guardada y lo guarda en la clase.
// Si ya existe, no se vuelve a generar (escenario 3). El uid sale de la sesión y la clase tiene que ser del estudiante.
export async function generateSummaryAction(
  _prevState: GenerateSummaryState,
  formData: FormData,
): Promise<GenerateSummaryState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  const { uid } = await requireSession();

  try {
    const course = await getCourse(uid, courseId);
    if (!course) return { status: "error", message: CLASS_MESSAGES.noAccess };

    const found = await getClassContent(uid, course.id, classId);
    if (!found) return { status: "error", message: SUMMARY_MESSAGES.notFound };

    // Ya generado: se muestra el guardado, sin gastar otra llamada a la IA
    if (found.summary) return { status: "done" };

    if (!found.transcript) return { status: "error", message: SUMMARY_MESSAGES.noTranscript };

    // HU04, escenario 2: sin el correo verificado no se genera
    if (!(await isEmailVerified(uid))) return { status: "error", message: VERIFICATION_MESSAGES.required };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Falta la variable de entorno GEMINI_API_KEY.");
      return { status: "error", message: SUMMARY_MESSAGES.generateFailed };
    }
    const client = new GoogleGenAI({ apiKey }) as unknown as GeminiClient;

    const generated = await generateSummary(client, transcriptToPlainText(found.transcript));
    if (!generated.ok) return { status: "error", message: SUMMARY_MESSAGES.generateFailed };

    await classesCollection(uid, course.id)
      .doc(classId)
      .update({ summary: generated.summary, summaryGeneratedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("Error al generar el resumen:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: SUMMARY_MESSAGES.generateFailed };
  }

  revalidatePath(`/cursos/${courseId}`);
  revalidatePath(`/cursos/${courseId}/clases/${classId}`);
  return { status: "done" };
}
