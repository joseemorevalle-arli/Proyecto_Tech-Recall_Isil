"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session";
import { isEmailVerified, VERIFICATION_MESSAGES } from "@/lib/auth/verification";
import { classesCollection, getClassQuiz } from "@/lib/classes/queries";
import { CLASS_MESSAGES } from "@/lib/classes/schema";
import { getCourse } from "@/lib/courses/queries";
import { attemptsCollection } from "@/lib/quiz/attempt-queries";
import { attemptInputSchema, type AttemptInput } from "@/lib/quiz/attempts";
import { generateQuiz } from "@/lib/quiz/generate-quiz";
import { QUIZ_QUESTIONS, scoreQuiz } from "@/lib/quiz/schema";
import { transcriptToPlainText } from "@/lib/transcription/text";
import type { GeminiClient } from "@/lib/syllabus/generate-course";

// Mensajes que ve el estudiante. No se exporta: un archivo "use server" solo puede exportar funciones async.
const QUIZ_MESSAGES = {
  noTranscript: "Esta clase todavía no tiene transcripción. Obtén la transcripción primero.",
  generateFailed:
    "No pudimos generar el cuestionario. Inténtalo de nuevo en unos minutos.",
  notFound: "No encontramos esa clase. Puede que ya la hayas eliminado.",
} as const;

export type GenerateQuizState = { formError?: string };

// HU11: genera el cuestionario de 10 preguntas a partir de la transcripción guardada de la clase.
// El uid sale de la sesión; la transcripción se lee solo en el servidor y la clase tiene que ser del estudiante.
export async function generateQuizAction(
  _prevState: GenerateQuizState,
  formData: FormData,
): Promise<GenerateQuizState> {
  const courseId = String(formData.get("courseId") ?? "");
  const classId = String(formData.get("classId") ?? "");

  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  const { uid } = await requireSession();

  try {
    const course = await getCourse(uid, courseId);
    if (!course) return { formError: CLASS_MESSAGES.noAccess };

    const found = await getClassQuiz(uid, course.id, classId);
    if (!found) return { formError: QUIZ_MESSAGES.notFound };

    // Ya generado: se abre el que está guardado, sin gastar otra llamada a la IA
    if (found.quiz) {
      redirectTo(course.id, classId);
    }

    if (!found.transcript) return { formError: QUIZ_MESSAGES.noTranscript };

    // HU04, escenario 2: sin el correo verificado no se genera (y no se gasta la llamada a la IA)
    if (!(await isEmailVerified(uid))) return { formError: VERIFICATION_MESSAGES.required };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Falta la variable de entorno GEMINI_API_KEY.");
      return { formError: QUIZ_MESSAGES.generateFailed };
    }
    const client = new GoogleGenAI({ apiKey }) as unknown as GeminiClient;

    const generated = await generateQuiz(client, transcriptToPlainText(found.transcript));
    if (!generated.ok) return { formError: QUIZ_MESSAGES.generateFailed };

    await classesCollection(uid, course.id)
      .doc(classId)
      .update({ quiz: generated.quiz, quizGeneratedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    // redirect() funciona lanzando una excepción: se deja pasar
    if (isRedirect(error)) throw error;
    console.error("Error al generar el cuestionario:", error instanceof Error ? error.name : "desconocido");
    return { formError: QUIZ_MESSAGES.generateFailed };
  }

  revalidatePath(`/cursos/${courseId}`);
  redirectTo(courseId, classId);
}

export type SaveAttemptResult = { ok: true; score: number } | { ok: false; message: string };

const SAVE_ATTEMPT_FAILED = "No pudimos guardar este intento en tu historial. Inténtalo de nuevo.";

// HU14: guarda un intento resuelto. Cada intento es un documento nuevo (escenario 2: no borra los anteriores).
// El puntaje lo calcula el servidor con el cuestionario guardado; del navegador solo se aceptan las respuestas.
export async function saveQuizAttemptAction(input: AttemptInput): Promise<SaveAttemptResult> {
  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  const { uid } = await requireSession();

  const parsed = attemptInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: SAVE_ATTEMPT_FAILED };
  const { courseId, classId, attemptId, answers } = parsed.data;

  try {
    const course = await getCourse(uid, courseId);
    if (!course) return { ok: false, message: CLASS_MESSAGES.noAccess };

    const found = await getClassQuiz(uid, course.id, classId);
    if (!found?.quiz) return { ok: false, message: QUIZ_MESSAGES.notFound };

    const score = scoreQuiz(found.quiz, answers);
    // create() falla si el id ya existe: un reenvío del mismo intento no lo duplica
    await attemptsCollection(uid)
      .doc(attemptId)
      .create({
        courseId: course.id,
        classId,
        className: found.name,
        score,
        total: QUIZ_QUESTIONS,
        answers,
        createdAt: FieldValue.serverTimestamp(),
      })
      .catch((error: unknown) => {
        // 6 = ALREADY_EXISTS: el intento ya estaba guardado
        if ((error as { code?: unknown })?.code !== 6) throw error;
      });

    revalidatePath("/historial");
    return { ok: true, score };
  } catch (error) {
    console.error("Error al guardar el intento:", error instanceof Error ? error.name : "desconocido");
    return { ok: false, message: SAVE_ATTEMPT_FAILED };
  }
}

function redirectTo(courseId: string, classId: string): never {
  redirect(`/cursos/${courseId}/clases/${classId}/cuestionario`);
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
