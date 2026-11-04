import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUIZ_CHOICES,
  QUIZ_QUESTIONS,
  parseQuiz,
  scoreQuiz,
  type Quiz,
} from "./schema.ts";

// Una pregunta válida con la respuesta correcta en la posición indicada
function question(n: number, correct = 0) {
  return {
    question: `Pregunta ${n}: ¿qué se explicó?`,
    choices: [`Opción A ${n}`, `Opción B ${n}`, `Opción C ${n}`],
    correctIndex: correct,
  };
}

function rawQuiz(count = QUIZ_QUESTIONS, mutate?: (q: ReturnType<typeof question>, i: number) => unknown) {
  const questions = Array.from({ length: count }, (_, i) => {
    const q = question(i + 1, i % QUIZ_CHOICES);
    return mutate ? mutate(q, i) : q;
  });
  return JSON.stringify({ questions });
}

test("acepta un cuestionario de 10 preguntas con 3 alternativas y una correcta", () => {
  const result = parseQuiz(rawQuiz());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quiz.questions.length, 10);
  for (const q of result.quiz.questions) assert.equal(q.choices.length, 3);
  assert.equal(result.quiz.questions[1].correctIndex, 1);
});

test("rechaza menos de 10 preguntas (escenario 3)", () => {
  assert.equal(parseQuiz(rawQuiz(9)).ok, false);
  assert.equal(parseQuiz(rawQuiz(0)).ok, false);
});

test("rechaza más de 10 preguntas: el cuestionario es de exactamente 10", () => {
  assert.equal(parseQuiz(rawQuiz(11)).ok, false);
});

test("rechaza una pregunta sin respuesta correcta (escenario 3)", () => {
  const sinCorrecta = rawQuiz(10, (q, i) => (i === 4 ? { question: q.question, choices: q.choices } : q));
  assert.equal(parseQuiz(sinCorrecta).ok, false);
});

test("rechaza una respuesta correcta fuera de rango, negativa o que no es entera", () => {
  for (const bad of [3, -1, 1.5, "0", null]) {
    const raw = rawQuiz(10, (q, i) => (i === 0 ? { ...q, correctIndex: bad } : q));
    assert.equal(parseQuiz(raw).ok, false, `correctIndex ${String(bad)}`);
  }
});

test("rechaza preguntas con 2 o con 4 alternativas", () => {
  for (const choices of [["A", "B"], ["A", "B", "C", "D"]]) {
    const raw = rawQuiz(10, (q, i) => (i === 2 ? { ...q, choices } : q));
    assert.equal(parseQuiz(raw).ok, false, `${choices.length} alternativas`);
  }
});

test("rechaza alternativas repetidas dentro de una pregunta (habría dos correctas)", () => {
  const raw = rawQuiz(10, (q, i) => (i === 0 ? { ...q, choices: ["Igual", "Igual", "Otra"] } : q));
  assert.equal(parseQuiz(raw).ok, false);
  // Se comparan sin mayúsculas ni espacios sobrantes
  const raw2 = rawQuiz(10, (q, i) => (i === 0 ? { ...q, choices: ["Igual", " igual ", "Otra"] } : q));
  assert.equal(parseQuiz(raw2).ok, false);
});

test("rechaza textos vacíos o solo con espacios en la pregunta o en una alternativa", () => {
  const rawQ = rawQuiz(10, (q, i) => (i === 0 ? { ...q, question: "   " } : q));
  assert.equal(parseQuiz(rawQ).ok, false);
  const rawC = rawQuiz(10, (q, i) => (i === 0 ? { ...q, choices: ["A", "", "C"] } : q));
  assert.equal(parseQuiz(rawC).ok, false);
});

test("rechaza preguntas repetidas", () => {
  const raw = rawQuiz(10, (q, i) => (i === 1 ? { ...q, question: "Pregunta 1: ¿qué se explicó?" } : q));
  assert.equal(parseQuiz(raw).ok, false);
});

test("rechaza lo que no es JSON, un JSON sin 'questions' o vacío", () => {
  for (const raw of ["", "no es json", "{}", "[]", "null", '{"questions":"x"}']) {
    assert.equal(parseQuiz(raw).ok, false, raw);
  }
});

test("acepta el JSON envuelto en una cerca de código markdown", () => {
  const result = parseQuiz("```json\n" + rawQuiz() + "\n```");
  assert.equal(result.ok, true);
});

test("recorta los espacios de los textos y descarta campos que no pertenecen al cuestionario", () => {
  const raw = rawQuiz(10, (q) => ({ ...q, question: `  ${q.question}  `, extra: "no debe pasar" }));
  const result = parseQuiz(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quiz.questions[0].question, "Pregunta 1: ¿qué se explicó?");
  assert.equal("extra" in result.quiz.questions[0], false);
});

test("el puntaje cuenta las respuestas correctas", () => {
  const parsed = parseQuiz(rawQuiz());
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const quiz: Quiz = parsed.quiz;
  const todasBien = quiz.questions.map((q) => q.correctIndex);
  assert.equal(scoreQuiz(quiz, todasBien), 10);
  const todasMal = quiz.questions.map((q) => (q.correctIndex + 1) % 3);
  assert.equal(scoreQuiz(quiz, todasMal), 0);
  const mitad = quiz.questions.map((q, i) => (i < 5 ? q.correctIndex : (q.correctIndex + 1) % 3));
  assert.equal(scoreQuiz(quiz, mitad), 5);
});

test("una pregunta sin responder no suma puntos", () => {
  const parsed = parseQuiz(rawQuiz());
  if (!parsed.ok) throw new Error("cuestionario de prueba inválido");
  const answers: Array<number | null> = parsed.quiz.questions.map((q) => q.correctIndex);
  answers[3] = null;
  assert.equal(scoreQuiz(parsed.quiz, answers), 9);
});
