import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MANUAL_TRANSCRIPT_MESSAGES as M,
  MAX_MANUAL_TRANSCRIPT_BYTES,
  validateManualTranscript,
} from "./manual.ts";

const encode = (text: string) => new TextEncoder().encode(text);

const SENTENCE = "Hoy vemos el modelo entidad-relación y cómo una clave foránea referencia a otra tabla. ";
const LONG_TEXT = SENTENCE.repeat(5);

const VTT = ["WEBVTT", "", "1", "00:00:01.000 --> 00:00:04.000", LONG_TEXT, ""].join("\n");

test("acepta un .vtt con líneas de tiempo (escenario 1)", () => {
  const result = validateManualTranscript("clase.vtt", encode(VTT));
  assert.deepEqual(result, { ok: true, transcript: VTT, format: "vtt" });
});

test("acepta un .txt con texto plano (escenario 1)", () => {
  const result = validateManualTranscript("Clase 3.TXT", encode(LONG_TEXT));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.format, "txt");
});

test("quita la marca BOM que agregan algunos editores", () => {
  const result = validateManualTranscript("clase.txt", encode(`\uFEFF${LONG_TEXT}`));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.transcript.startsWith("\uFEFF"), false);
});

test("rechaza otros formatos (escenario 2)", () => {
  for (const name of ["clase.pdf", "clase.docx", "clase.srt", "clase", "clase.vtt.exe"]) {
    assert.deepEqual(validateManualTranscript(name, encode(LONG_TEXT)), { ok: false, message: M.invalidFormat }, name);
  }
});

test("rechaza un archivo vacío o solo con espacios (escenario 2)", () => {
  assert.deepEqual(validateManualTranscript("clase.txt", new Uint8Array()), { ok: false, message: M.empty });
  assert.deepEqual(validateManualTranscript("clase.txt", encode(" \n\t \n")), { ok: false, message: M.empty });
});

test("rechaza un binario con la extensión cambiada", () => {
  const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0xe2, 0xe3, 0xcf, 0xd3]);
  assert.deepEqual(validateManualTranscript("clase.txt", pdfBytes), { ok: false, message: M.unreadable });
  const withNull = encode(`${LONG_TEXT}\u0000${LONG_TEXT}`);
  assert.deepEqual(validateManualTranscript("clase.txt", withNull), { ok: false, message: M.unreadable });
});

test("rechaza un .vtt sin encabezado WEBVTT o sin líneas de tiempo", () => {
  assert.deepEqual(validateManualTranscript("clase.vtt", encode(LONG_TEXT)), { ok: false, message: M.vttWithoutCues });
  assert.deepEqual(
    validateManualTranscript("clase.vtt", encode(`WEBVTT\n\n${LONG_TEXT}`)),
    { ok: false, message: M.vttWithoutCues },
  );
});

test("rechaza un archivo que supera el límite", () => {
  const big = new Uint8Array(MAX_MANUAL_TRANSCRIPT_BYTES + 1).fill(0x61);
  assert.deepEqual(validateManualTranscript("clase.txt", big), { ok: false, message: M.tooLarge });
});

test("rechaza una transcripción demasiado corta", () => {
  assert.deepEqual(validateManualTranscript("clase.txt", encode("Hola a todos.")), { ok: false, message: M.tooShort });
  const shortVtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHola.\n";
  assert.deepEqual(validateManualTranscript("clase.vtt", encode(shortVtt)), { ok: false, message: M.tooShort });
});
