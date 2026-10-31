import { test } from "node:test";
import assert from "node:assert/strict";
import { vttToPlainText } from "./text.ts";

// Zoom escribe el nombre de quien habla en MAYÚSCULAS y seguido de «: » (se comprobó con una grabación real)
const VTT = [
  "WEBVTT",
  "",
  "1",
  "00:04:55.780 --> 00:04:57.760",
  "MARIO ANTONIO HUAPALLA MORALES: Bueno, muchachos. ¿cómo están?",
  "",
  "2",
  "00:04:58.090 --> 00:05:01.310",
  "MARIO ANTONIO HUAPALLA MORALES: Hoy vemos el modelo entidad-relación.",
  "",
  "3",
  "00:05:02.000 --> 00:05:04.000",
  "ANA PÉREZ: una duda: ¿qué es una clave foránea?",
  "",
].join("\r\n");

test("deja solo lo que se dijo: sin encabezado, numeración ni tiempos", () => {
  const text = vttToPlainText(VTT);
  assert.equal(text.includes("WEBVTT"), false);
  assert.equal(text.includes("-->"), false);
  assert.equal(/\d{2}:\d{2}:\d{2}/.test(text), false);
  assert.match(text, /Hoy vemos el modelo entidad-relación\./);
});

test("quita el nombre de quien habla (no es contenido de la clase)", () => {
  const text = vttToPlainText(VTT);
  assert.equal(text.includes("HUAPALLA"), false);
  assert.equal(text.includes("ANA PÉREZ"), false);
});

test("conserva los dos puntos que forman parte de lo dicho", () => {
  assert.match(vttToPlainText(VTT), /una duda: ¿qué es una clave foránea\?/);
});

test("una intervención por línea y sin líneas vacías", () => {
  const lines = vttToPlainText(VTT).split("\n");
  assert.equal(lines.length, 3);
  assert.equal(lines.every((l) => l.trim().length > 0), true);
});

test("un VTT sin intervenciones da un texto vacío", () => {
  assert.equal(vttToPlainText("WEBVTT\n\n"), "");
});

test("quita las etiquetas de formato del VTT", () => {
  const vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<v Ana>Hola <b>a todos</b></v>\n";
  assert.equal(vttToPlainText(vtt), "Hola a todos");
});
