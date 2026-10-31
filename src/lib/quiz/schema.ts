import { z } from "zod";

// HU11: el cuestionario tiene siempre 10 preguntas con 3 alternativas y una sola correcta
export const QUIZ_QUESTIONS = 10;
export const QUIZ_CHOICES = 3;

const text = z.string().trim().min(1);

// correctIndex es la posición (0, 1 o 2) de la alternativa correcta. Un solo número garantiza
// que haya exactamente una correcta; lo que hay que evitar es que dos alternativas digan lo mismo.
export const questionSchema = z
  .object({
    question: text,
    choices: z.array(text).length(QUIZ_CHOICES),
    correctIndex: z.number().int().min(0).max(QUIZ_CHOICES - 1),
  })
  .refine(
    (q) => new Set(q.choices.map(normalize)).size === q.choices.length,
    { message: "Hay alternativas repetidas" },
  );

export const quizSchema = z
  .object({ questions: z.array(questionSchema).length(QUIZ_QUESTIONS) })
  .refine(
    (quiz) => new Set(quiz.questions.map((q) => normalize(q.question))).size === quiz.questions.length,
    { message: "Hay preguntas repetidas" },
  );

export type Quiz = z.output<typeof quizSchema>;
export type QuizQuestion = Quiz["questions"][number];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export type ParseQuizResult = { ok: true; quiz: Quiz } | { ok: false };

// Convierte la respuesta de la IA en un cuestionario válido. Cualquier desvío del formato
// (HU11, escenario 3) devuelve { ok: false }: el cuestionario incompleto nunca llega a la pantalla.
export function parseQuiz(raw: string): ParseQuizResult {
  // Aunque se pide JSON puro, a veces llega dentro de una cerca de código markdown
  const body = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false };
  }

  // z.object descarta los campos que no están en el esquema
  const parsed = quizSchema.safeParse(data);
  return parsed.success ? { ok: true, quiz: parsed.data } : { ok: false };
}

// Puntaje: cuántas respuestas coinciden con la correcta. Una pregunta sin responder (null) no suma.
export function scoreQuiz(quiz: Quiz, answers: ReadonlyArray<number | null>): number {
  return quiz.questions.reduce(
    (total, q, i) => (answers[i] === q.correctIndex ? total + 1 : total),
    0,
  );
}
