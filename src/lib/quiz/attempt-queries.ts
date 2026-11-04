import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import type { QuizAttempt } from "./attempts";

// HU14: users/{uid}/quizAttempts. Siempre se parte del uid de la sesión.
export function attemptsCollection(uid: string) {
  return adminDb().collection("users").doc(uid).collection("quizAttempts");
}

const storedAttemptSchema = z.object({
  courseId: z.string(),
  classId: z.string(),
  className: z.string(),
  score: z.number().int(),
  total: z.number().int(),
  createdAt: z.instanceof(Timestamp).transform((timestamp) => timestamp.toDate()),
});

// Tope de intentos que se leen para el historial (suficiente para un ciclo)
const MAX_ATTEMPTS_LISTED = 500;

// Intentos del estudiante, del más reciente al más antiguo. Un documento con formato inválido se omite.
export async function listAttempts(uid: string): Promise<QuizAttempt[]> {
  const snapshot = await attemptsCollection(uid).orderBy("createdAt", "desc").limit(MAX_ATTEMPTS_LISTED).get();

  const attempts: QuizAttempt[] = [];
  for (const doc of snapshot.docs) {
    const parsed = storedAttemptSchema.safeParse(doc.data());
    if (parsed.success) {
      attempts.push({ id: doc.id, ...parsed.data });
    } else {
      console.error(`Intento con formato inválido (${doc.ref.path})`);
    }
  }
  return attempts;
}

// Al eliminar un curso o una clase se borran también sus intentos, para no dejar historial huérfano
export async function deleteAttempts(uid: string, field: "courseId" | "classId", value: string): Promise<void> {
  const db = adminDb();
  const snapshot = await attemptsCollection(uid).where(field, "==", value).select().get();
  // Un lote de Firestore admite hasta 500 operaciones
  for (let i = 0; i < snapshot.docs.length; i += 500) {
    const batch = db.batch();
    for (const doc of snapshot.docs.slice(i, i + 500)) batch.delete(doc.ref);
    await batch.commit();
  }
}
