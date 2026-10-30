import { test } from "node:test";
import assert from "node:assert/strict";
import { mapGeminiCourse } from "./map-course.ts";

const VALID = JSON.stringify({
  id: "desarrollo_web",
  title: "Desarrollo Web Integrado",
  content: [
    {
      id: 1,
      title: "Fundamentos",
      descripcion: "Indicador de logro",
      sesiones: [
        { id: 1, tema: "Introducción", descripcion: "Presenta el curso" },
        { id: 2, tema: "HTML y CSS", descripcion: "Construye una página" },
      ],
    },
    {
      id: 2,
      title: "Servidor",
      descripcion: "Otro indicador",
      sesiones: [{ id: 3, tema: "Rutas", descripcion: "Define rutas" }],
    },
  ],
});

test("convierte la respuesta de Gemini a la forma del curso que lee la HU07", () => {
  const result = mapGeminiCourse(VALID);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.course, {
    name: "Desarrollo Web Integrado",
    units: [
      {
        number: 1,
        title: "Fundamentos",
        sessions: [
          { number: 1, title: "Introducción" },
          { number: 2, title: "HTML y CSS" },
        ],
      },
      { number: 2, title: "Servidor", sessions: [{ number: 3, title: "Rutas" }] },
    ],
  });
});

test("recorta espacios sobrantes en nombre, unidades y sesiones", () => {
  const raw = JSON.stringify({
    title: "  Curso con espacios  ",
    content: [{ title: "  Unidad  ", sesiones: [{ tema: "  Tema  " }] }],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.course.name, "Curso con espacios");
  assert.equal(result.course.units[0].title, "Unidad");
  assert.equal(result.course.units[0].sessions[0].title, "Tema");
});

test("numera las unidades en orden y las sesiones de corrido en todo el curso, aunque Gemini no traiga los ids", () => {
  const raw = JSON.stringify({
    title: "Curso",
    content: [
      { title: "A", sesiones: [{ tema: "A1" }, { tema: "A2" }] },
      { title: "B", sesiones: [{ tema: "B1" }] },
    ],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.course.units.map((u) => [u.number, u.sessions.map((s) => s.number)]),
    [
      [1, [1, 2]],
      [2, [3]],
    ],
  );
});

test("usa la descripción de la sesión cuando el tema viene vacío", () => {
  const raw = JSON.stringify({
    title: "Curso",
    content: [{ title: "A", sesiones: [{ tema: "  ", descripcion: "Descripción útil" }] }],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.course.units[0].sessions[0].title, "Descripción útil");
});

test("descarta las sesiones sin tema ni descripción", () => {
  const raw = JSON.stringify({
    title: "Curso",
    content: [{ title: "A", sesiones: [{ tema: "" }, { tema: "Real" }] }],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.course.units[0].sessions, [{ number: 1, title: "Real" }]);
});

test("quita el prefijo «Unidad N:» y «Sesión N:» porque la pantalla ya numera", () => {
  const raw = JSON.stringify({
    title: "Curso",
    content: [
      {
        title: "Unidad 1: Fundamentos de la Calidad",
        sesiones: [{ tema: "Sesión 1: Conceptos" }, { tema: "SESION 2 - Tipos de pruebas" }],
      },
      { title: "unidad 2. Automatización", sesiones: [{ tema: "Sesion 3: Pruebas" }] },
    ],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.course.units.map((u) => [u.title, u.sessions.map((s) => s.title)]),
    [
      ["Fundamentos de la Calidad", ["Conceptos", "Tipos de pruebas"]],
      ["Automatización", ["Pruebas"]],
    ],
  );
});

test("no toca los títulos que solo empiezan parecido a un prefijo", () => {
  const raw = JSON.stringify({
    title: "Curso",
    content: [{ title: "Unidades de medida", sesiones: [{ tema: "Sesiones de scrum" }] }],
  });
  const result = mapGeminiCourse(raw);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.course.units[0].title, "Unidades de medida");
  assert.equal(result.course.units[0].sessions[0].title, "Sesiones de scrum");
});

test("rechaza un curso sin unidades", () => {
  assert.equal(mapGeminiCourse(JSON.stringify({ title: "Curso", content: [] })).ok, false);
});

test("rechaza si todas las unidades quedan vacías", () => {
  const raw = JSON.stringify({ title: "Curso", content: [{ title: "  ", sesiones: [] }] });
  assert.equal(mapGeminiCourse(raw).ok, false);
});

test("rechaza un JSON mal formado o vacío", () => {
  assert.equal(mapGeminiCourse("{ esto no es json").ok, false);
  assert.equal(mapGeminiCourse("").ok, false);
});

test("rechaza si falta el nombre del curso", () => {
  const raw = JSON.stringify({ content: [{ title: "A", sesiones: [{ tema: "A1" }] }] });
  assert.equal(mapGeminiCourse(raw).ok, false);
  const blank = JSON.stringify({ title: "   ", content: [{ title: "A", sesiones: [{ tema: "A1" }] }] });
  assert.equal(mapGeminiCourse(blank).ok, false);
});

test("rechaza una respuesta que no es un objeto", () => {
  assert.equal(mapGeminiCourse("null").ok, false);
  assert.equal(mapGeminiCourse("[]").ok, false);
  assert.equal(mapGeminiCourse('"texto"').ok, false);
});
