import { test } from "node:test";
import assert from "node:assert/strict";
import { selectSupportedQuestions } from "./select-supported-questions.ts";

// Transcripción con un error típico de Zoom («Pon Xml») y un salto de línea en medio de una frase
const TRANSCRIPT =
  "Hoy vemos el modelo entidad-relación.\nUna clave foránea referencia otra tabla.\nPara guardar datos Pon Xml en el archivo,\nluego se valida el esquema.";
const GOOD = "Una clave foránea referencia otra tabla";

type Candidate = { question: string; choices: string[]; correctIndex: number; evidence: unknown };

function candidate(i: number, evidence: unknown = GOOD): Candidate {
  return { question: `Pregunta ${i}`, choices: [`A${i}`, `B${i}`, `C${i}`], correctIndex: i % 3, evidence };
}

const raw = (candidates: unknown[]) => JSON.stringify({ questions: candidates });
const many = (n: number) => Array.from({ length: n }, (_, i) => candidate(i + 1));

test("acepta 10 candidatas con respaldo y quita evidence del resultado", () => {
  const result = selectSupportedQuestions(raw(many(10)), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quiz.questions.length, 10);
  assert.equal(result.discarded, 0);
  for (const q of result.quiz.questions) assert.equal("evidence" in q, false);
});

test("descarta la candidata cuya evidencia no está en la transcripción", () => {
  const list = [...many(10), candidate(11), candidate(12)];
  list[3] = candidate(4, "Una frase que nunca se dijo en clase");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 1);
  assert.equal(result.quiz.questions.some((q) => q.question === "Pregunta 4"), false);
});

test("acepta evidencia con otra capitalización, tildes y puntuación", () => {
  const list = many(10);
  list[0] = candidate(1, "¡UNA CLAVE FORANEA, referencia... otra tabla!");
  list[1] = candidate(2, "modelo entidad relacion");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 0);
});

test("acepta evidencia copiada con el error de Zoom tal cual", () => {
  const list = many(10);
  list[0] = candidate(1, "guardar datos Pon Xml en el archivo");
  assert.equal(selectSupportedQuestions(raw(list), TRANSCRIPT).ok, true);
});

test("acepta evidencia que cruza un salto de línea", () => {
  const list = many(10);
  list[0] = candidate(1, "Hoy vemos el modelo entidad-relación. Una clave foránea");
  list[1] = candidate(2, "en el archivo, luego se valida el esquema");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 0);
});

test("descarta evidencia de menos de 3 palabras o de menos de 15 caracteres", () => {
  const result = selectSupportedQuestions(
    raw([
      candidate(1, "clave foránea"), // 2 palabras
      candidate(2, "el modelo"), // 2 palabras
      candidate(3, "Hoy vemos el"), // 3 palabras pero 11 caracteres
      ...many(10).map((c, i) => ({ ...c, question: `Válida ${i}` })),
    ]),
    TRANSCRIPT,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 3);
  assert.equal(result.quiz.questions.every((q) => q.question.startsWith("Válida")), true);
});

test("descarta evidencia ausente o que no es texto", () => {
  const list = [...many(10), { question: "Sin evidencia", choices: ["a", "b", "c"], correctIndex: 0 }, candidate(12, 42)];
  list[0] = candidate(1, undefined);
  list[1] = candidate(2, "");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, false);
});

test("13 candidatas con 2 sin respaldo: entrega 10, en orden", () => {
  const list = many(13);
  list[1] = candidate(2, "algo que no está en la clase");
  list[5] = candidate(6, "otra cosa inventada por la IA");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 2);
  assert.deepEqual(
    result.quiz.questions.map((q) => q.question),
    [1, 3, 4, 5, 7, 8, 9, 10, 11, 12].map((n) => `Pregunta ${n}`),
  );
});

test("13 candidatas con 4 sin respaldo (9 válidas): { ok: false }", () => {
  const list = many(13);
  for (const i of [0, 4, 8, 12]) list[i] = candidate(i + 1, "frase inventada que no existe");
  assert.deepEqual(selectSupportedQuestions(raw(list), TRANSCRIPT), { ok: false });
});

test("una candidata mala no tumba a las demás: esquema inválido y pregunta repetida", () => {
  const list = [
    { ...candidate(1), choices: ["igual", "IGUAL ", "otra"] }, // alternativas repetidas
    { ...candidate(2), correctIndex: 3 }, // fuera de rango
    { ...candidate(3), correctIndex: 1.5 },
    { ...candidate(4), choices: ["a", "b"] },
    { ...candidate(5), question: "   " },
    "no es un objeto",
    null,
    ...many(10).slice(0, 3),
    { ...candidate(99), question: " PREGUNTA 1 " }, // repite una ya aceptada
    ...many(10).slice(3),
  ];
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.quiz.questions.length, 10);
  assert.equal(result.discarded, 8);
});

test("no acepta dos preguntas iguales aunque cambien mayúsculas o espacios", () => {
  const list = [...many(10).slice(0, 9), { ...candidate(10), question: "  pregunta   1 " }];
  assert.deepEqual(selectSupportedQuestions(raw(list), TRANSCRIPT), { ok: false });
});

test("soporta la cerca de código markdown", () => {
  const fenced = "```json\n" + raw(many(10)) + "\n```";
  assert.equal(selectSupportedQuestions(fenced, TRANSCRIPT).ok, true);
});

test("respuestas que no son JSON o sin lista de preguntas devuelven { ok: false }", () => {
  for (const bad of ["", "no es json", "{}", '{"questions": 5}', "[]", "null"]) {
    assert.deepEqual(selectSupportedQuestions(bad, TRANSCRIPT), { ok: false });
  }
});

test("informa cuántas candidatas se examinaron y se descartaron sin exponer texto", () => {
  const list = many(13);
  list[0] = candidate(1, "frase inventada que no existe");
  const seen: Array<{ discarded: number; total: number }> = [];
  selectSupportedQuestions(raw(list), TRANSCRIPT, (stats) => seen.push(stats));
  assert.deepEqual(seen, [{ discarded: 1, total: 13 }]);
});

test("no acepta una evidencia que es solo un trozo de otras palabras de la transcripción", () => {
  // «clave foránea referencia otr» cruza a mitad de la palabra «otra»: no es una frase dicha en la clase
  const list = [...many(10), candidate(11), candidate(12)];
  list[0] = candidate(1, "clave foránea referencia otr");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 1);
  assert.equal(result.quiz.questions.some((q) => q.question === "Pregunta 1"), false);
});

test("descarta una evidencia de 15 o más caracteres pero de menos de 3 palabras", () => {
  // Existe en la transcripción como «entidad relación» (tras normalizar), con 17 caracteres y 2 palabras
  const list = [...many(10), candidate(11), candidate(12)];
  list[0] = candidate(1, "entidad-relación");
  const result = selectSupportedQuestions(raw(list), TRANSCRIPT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.discarded, 1);
  assert.equal(result.quiz.questions.some((q) => q.question === "Pregunta 1"), false);
});
