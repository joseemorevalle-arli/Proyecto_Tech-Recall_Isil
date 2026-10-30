import { test } from "node:test";
import assert from "node:assert/strict";
import { COURSE_EDIT_MESSAGES, normalizeCourseEdit } from "./edit.ts";

const VALID = {
  name: "Desarrollo Web",
  units: [
    { title: "Fundamentos", sessions: [{ title: "Introducción" }, { title: "HTML" }] },
    { title: "Servidor", sessions: [{ title: "Rutas" }] },
  ],
};

test("convierte lo editado al formato del curso, con unidades y sesiones numeradas", () => {
  const result = normalizeCourseEdit(VALID);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.course, {
    name: "Desarrollo Web",
    units: [
      {
        number: 1,
        title: "Fundamentos",
        sessions: [
          { number: 1, title: "Introducción" },
          { number: 2, title: "HTML" },
        ],
      },
      { number: 2, title: "Servidor", sessions: [{ number: 3, title: "Rutas" }] },
    ],
  });
});

test("renumera cuando se quita o se reordena algo, sin confiar en los números que manda el navegador", () => {
  const result = normalizeCourseEdit({
    name: "Curso",
    units: [
      { number: 9, title: "B", sessions: [{ number: 40, title: "B1" }] },
      { number: 3, title: "A", sessions: [{ number: 7, title: "A1" }, { number: 2, title: "A2" }] },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.course.units.map((u) => [u.number, u.sessions.map((s) => s.number)]),
    [
      [1, [1]],
      [2, [2, 3]],
    ],
  );
});

test("recorta espacios sobrantes", () => {
  const result = normalizeCourseEdit({
    name: "  Curso  ",
    units: [{ title: "  Unidad  ", sessions: [{ title: "  Sesión  " }] }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.course.name, "Curso");
  assert.equal(result.course.units[0].title, "Unidad");
  assert.equal(result.course.units[0].sessions[0].title, "Sesión");
});

test("acepta una unidad sin sesiones y un curso sin unidades", () => {
  assert.equal(normalizeCourseEdit({ name: "Curso", units: [{ title: "U", sessions: [] }] }).ok, true);
  assert.equal(normalizeCourseEdit({ name: "Curso", units: [] }).ok, true);
});

test("rechaza un nombre vacío o de solo espacios", () => {
  for (const name of ["", "   "]) {
    const result = normalizeCourseEdit({ ...VALID, name });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.message, COURSE_EDIT_MESSAGES.nameRequired);
  }
});

test("rechaza un nombre demasiado largo", () => {
  const result = normalizeCourseEdit({ ...VALID, name: "x".repeat(121) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.message, COURSE_EDIT_MESSAGES.nameTooLong);
});

test("rechaza una unidad sin título", () => {
  const result = normalizeCourseEdit({ name: "Curso", units: [{ title: "  ", sessions: [] }] });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.message, COURSE_EDIT_MESSAGES.unitTitleRequired);
});

test("rechaza una sesión sin título", () => {
  const result = normalizeCourseEdit({
    name: "Curso",
    units: [{ title: "U", sessions: [{ title: "" }] }],
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.message, COURSE_EDIT_MESSAGES.sessionTitleRequired);
});

test("rechaza títulos de unidad o sesión demasiado largos", () => {
  const long = "x".repeat(201);
  assert.equal(normalizeCourseEdit({ name: "C", units: [{ title: long, sessions: [] }] }).ok, false);
  assert.equal(
    normalizeCourseEdit({ name: "C", units: [{ title: "U", sessions: [{ title: long }] }] }).ok,
    false,
  );
});

test("rechaza un curso con demasiadas unidades o sesiones", () => {
  const unit = { title: "U", sessions: [] };
  assert.equal(normalizeCourseEdit({ name: "C", units: Array(61).fill(unit) }).ok, false);
  const sessions = Array(101).fill({ title: "S" });
  assert.equal(normalizeCourseEdit({ name: "C", units: [{ title: "U", sessions }] }).ok, false);
});

test("rechaza datos que no tienen la forma de un curso", () => {
  for (const bad of [null, undefined, "texto", 5, [], {}, { name: "C" }, { name: "C", units: "x" }, { name: 3, units: [] }]) {
    assert.equal(normalizeCourseEdit(bad).ok, false, JSON.stringify(bad));
  }
  assert.equal(normalizeCourseEdit({ name: "C", units: [null] }).ok, false);
  assert.equal(normalizeCourseEdit({ name: "C", units: [{ title: "U", sessions: [null] }] }).ok, false);
});

test("ignora campos de más que mande el navegador", () => {
  const result = normalizeCourseEdit({
    name: "Curso",
    createdAt: "2020-01-01",
    sourceFile: "otro.pdf",
    units: [{ title: "U", extra: true, sessions: [] }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.course).sort(), ["name", "units"]);
  assert.deepEqual(Object.keys(result.course.units[0]).sort(), ["number", "sessions", "title"]);
});
