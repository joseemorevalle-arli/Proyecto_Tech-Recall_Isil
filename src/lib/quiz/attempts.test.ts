import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptInputSchema, groupAttemptsByCourse, type QuizAttempt } from "./attempts.ts";

const VALID = {
  courseId: "curso1",
  classId: "clase1",
  attemptId: "0b6f2a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
  answers: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0],
};

test("acepta un intento con las 10 respuestas", () => {
  assert.equal(attemptInputSchema.safeParse(VALID).success, true);
});

test("rechaza respuestas incompletas, fuera de rango o un id de intento manipulado", () => {
  const bad = [
    { ...VALID, answers: VALID.answers.slice(0, 9) },
    { ...VALID, answers: [...VALID.answers, 1] },
    { ...VALID, answers: [3, 1, 2, 0, 1, 2, 0, 1, 2, 0] },
    { ...VALID, answers: [-1, 1, 2, 0, 1, 2, 0, 1, 2, 0] },
    { ...VALID, answers: [0.5, 1, 2, 0, 1, 2, 0, 1, 2, 0] },
    { ...VALID, answers: [null, 1, 2, 0, 1, 2, 0, 1, 2, 0] },
    { ...VALID, attemptId: "../otro" },
    { ...VALID, attemptId: "corto" },
  ];
  for (const input of bad) assert.equal(attemptInputSchema.safeParse(input).success, false, JSON.stringify(input));
});

function attempt(id: string, courseId: string, day: number, score = 5): QuizAttempt {
  return { id, courseId, classId: "c", className: "Clase", score, total: 10, createdAt: new Date(2026, 10, day) };
}

test("agrupa por curso, con los cursos por nombre y los intentos del más reciente al más antiguo (escenario 1)", () => {
  const names = new Map([
    ["bd", "Base de Datos"],
    ["alg", "Algoritmos"],
  ]);
  const groups = groupAttemptsByCourse(
    [attempt("1", "bd", 1), attempt("2", "alg", 3), attempt("3", "bd", 5), attempt("4", "bd", 2)],
    names,
  );
  assert.deepEqual(groups.map((g) => g.courseName), ["Algoritmos", "Base de Datos"]);
  assert.deepEqual(groups[1].attempts.map((a) => a.id), ["3", "4", "1"]);
});

test("conserva todos los intentos de la misma clase (escenario 2)", () => {
  const groups = groupAttemptsByCourse(
    [attempt("1", "bd", 1, 4), attempt("2", "bd", 2, 9)],
    new Map([["bd", "Base de Datos"]]),
  );
  assert.deepEqual(groups[0].attempts.map((a) => a.score), [9, 4]);
});

test("omite los intentos de un curso que ya no existe y, sin intentos, devuelve una lista vacía (escenario 3)", () => {
  assert.deepEqual(groupAttemptsByCourse([attempt("1", "borrado", 1)], new Map()), []);
  assert.deepEqual(groupAttemptsByCourse([], new Map([["bd", "Base de Datos"]])), []);
});
