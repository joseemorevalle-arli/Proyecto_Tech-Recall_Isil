import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLASS_MESSAGES,
  CLASS_NAME_MAX_LENGTH,
  classSchema,
  ZOOM_RECORDING_PREFIX,
} from "./schema.ts";

const VALID_URL = "https://isil-pe.zoom.us/rec/play/AbC123-xyz.456";

// Devuelve el primer mensaje de error de un campo, o null si el campo es válido
function zoomUrlError(url: string): string | null {
  const result = classSchema.shape.zoomUrl.safeParse(url);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}

function nameError(name: string): string | null {
  const result = classSchema.shape.name.safeParse(name);
  return result.success ? null : (result.error.issues[0]?.message ?? null);
}

test("el mensaje de formato nombra el prefijo exacto de los criterios de aceptación", () => {
  assert.equal(ZOOM_RECORDING_PREFIX, "https://isil-pe.zoom.us/rec/play/");
  assert.equal(
    CLASS_MESSAGES.zoomUrlInvalid,
    "El enlace debe tener el formato https://isil-pe.zoom.us/rec/play/...",
  );
});

test("escenario 1: acepta un enlace de reproducción de isil-pe.zoom.us", () => {
  assert.equal(zoomUrlError(VALID_URL), null);
});

test("escenario 1: acepta un enlace real de grabación (código largo con . y _)", () => {
  assert.equal(
    zoomUrlError(
      "https://isil-pe.zoom.us/rec/play/0t0DCKC2PLW0U0BdoIzEuw0faK13kV9Tx6QwukPHK2JyCiTLtbyvqMWKXP48ZhSIdB8NzlBfww7ickfX.K9xyuCTnXJgn3A_R",
    ),
    null,
  );
});

test("escenario 1: acepta el enlace con parámetros", () => {
  assert.equal(
    zoomUrlError("https://isil-pe.zoom.us/rec/play/AbC123?startTime=1700000000000"),
    null,
  );
});

test("escenario 1: acepta el enlace en cuanto se escribe la primera letra del código", () => {
  assert.equal(zoomUrlError("https://isil-pe.zoom.us/rec/play/a"), null);
});

test("escenario 1: ignora los espacios al inicio y al final del enlace", () => {
  assert.equal(zoomUrlError(`  ${VALID_URL}  `), null);
});

test("escenario 2: rechaza el enlace para compartir (no es de reproducción)", () => {
  assert.equal(
    zoomUrlError("https://isil-pe.zoom.us/rec/share/AbC123"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("escenario 2: rechaza otro dominio", () => {
  assert.equal(
    zoomUrlError("https://zoom.us/rec/play/AbC123"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("escenario 2: rechaza un dominio que solo contiene isil-pe.zoom.us", () => {
  assert.equal(
    zoomUrlError("https://isil-pe.zoom.us.evil.com/rec/play/AbC123"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
  assert.equal(
    zoomUrlError("https://evil.com/https://isil-pe.zoom.us/rec/play/AbC123"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("escenario 2: rechaza el enlace sin https", () => {
  assert.equal(
    zoomUrlError("http://isil-pe.zoom.us/rec/play/AbC123"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("escenario 2: rechaza el enlace incompleto (falta el código de la grabación)", () => {
  assert.equal(
    zoomUrlError("https://isil-pe.zoom.us/rec/play/"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("escenario 2: rechaza un enlace que se sale de /rec/play/", () => {
  assert.equal(
    zoomUrlError("https://isil-pe.zoom.us/rec/play/abc/../../admin"),
    CLASS_MESSAGES.zoomUrlInvalid,
  );
});

test("pide pegar el enlace cuando el campo está vacío o solo tiene espacios", () => {
  assert.equal(zoomUrlError(""), CLASS_MESSAGES.zoomUrlRequired);
  assert.equal(zoomUrlError("   "), CLASS_MESSAGES.zoomUrlRequired);
});

test("rechaza un enlace de más de 2048 caracteres", () => {
  const tooLong = `${ZOOM_RECORDING_PREFIX}${"a".repeat(2048)}`;
  assert.equal(zoomUrlError(tooLong), CLASS_MESSAGES.zoomUrlInvalid);
});

test("escenario 3: el nombre vacío no es válido y se indica que es obligatorio", () => {
  assert.equal(nameError(""), "Escribe el nombre de la clase");
});

test("escenario 3: un nombre de solo espacios cuenta como vacío", () => {
  assert.equal(nameError("     "), CLASS_MESSAGES.nameRequired);
});

test("acepta un nombre normal y lo guarda sin espacios sobrantes", () => {
  const result = classSchema.safeParse({
    name: "  Sesión 1: Introducción  ",
    zoomUrl: ` ${VALID_URL} `,
  });
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.data, {
    name: "Sesión 1: Introducción",
    zoomUrl: VALID_URL,
  });
});

test("acepta un nombre de 120 caracteres y rechaza uno de 121", () => {
  assert.equal(nameError("a".repeat(CLASS_NAME_MAX_LENGTH)), null);
  assert.equal(
    nameError("a".repeat(CLASS_NAME_MAX_LENGTH + 1)),
    CLASS_MESSAGES.nameTooLong,
  );
});

test("el servidor rechaza el envío con enlace válido y nombre vacío, y solo informa del nombre", () => {
  const result = classSchema.safeParse({ name: "", zoomUrl: VALID_URL });
  assert.equal(result.success, false);
  if (result.success) return;
  const fields = result.error.issues.map((issue) => issue.path[0]);
  assert.deepEqual(fields, ["name"]);
  assert.equal(result.error.issues[0]?.message, CLASS_MESSAGES.nameRequired);
});

test("el servidor rechaza el envío con nombre válido y enlace de otro dominio", () => {
  const result = classSchema.safeParse({
    name: "Sesión 1",
    zoomUrl: "https://zoom.us/rec/play/AbC123",
  });
  assert.equal(result.success, false);
  if (result.success) return;
  assert.deepEqual(
    result.error.issues.map((issue) => issue.path[0]),
    ["zoomUrl"],
  );
});
