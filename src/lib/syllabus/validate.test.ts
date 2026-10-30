import { test } from "node:test";
import assert from "node:assert/strict";
import { isIsilSyllabus } from "./validate.ts";

// Texto sintético con los marcadores de un sílabo oficial (no es un sílabo real)
const VALID = `
  SÍLABO · Instituto ISIL
  Metodología ISIL: clases con enfoque práctico.
  Modalidades: Presencial, Semipresencial, Remota, Semirremota y Virtual.
  Sistema de evaluación
  ESQUEMA DE EVALUACIÓN
`;

test("acepta un texto con todos los marcadores del sílabo ISIL", () => {
  assert.equal(isIsilSyllabus(VALID), true);
});

test("ignora mayúsculas y espacios de más", () => {
  assert.equal(isIsilSyllabus(VALID.toUpperCase().replace(/ /g, "   ")), true);
});

test("rechaza un PDF con texto que no es un sílabo", () => {
  assert.equal(isIsilSyllabus("Factura electrónica N° 0001 · Total S/ 120.00"), false);
});

test("rechaza un texto vacío (PDF escaneado o sin texto)", () => {
  assert.equal(isIsilSyllabus(""), false);
  assert.equal(isIsilSyllabus("   \n  "), false);
});

test("rechaza si falta un solo marcador", () => {
  assert.equal(isIsilSyllabus(VALID.replace("ESQUEMA DE EVALUACIÓN", "")), false);
  assert.equal(isIsilSyllabus(VALID.replace("Sistema de evaluación", "")), false);
});

test("rechaza si solo menciona ISIL sin la estructura de un sílabo", () => {
  assert.equal(isIsilSyllabus("Boleta de pago del Instituto ISIL"), false);
});
