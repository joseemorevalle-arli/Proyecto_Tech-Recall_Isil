import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCourse, type GeminiClient } from "./generate-course.ts";

const RESPONSE = JSON.stringify({
  title: "Curso de prueba",
  content: [{ title: "Unidad 1", sesiones: [{ tema: "Sesión 1" }] }],
});

const PDF = new Blob(["%PDF-1.4"], { type: "application/pdf" });

// Cliente falso: no usa la red. Registra qué archivos se subieron y se borraron.
function fakeClient(opts: { text?: string; generateError?: Error; hang?: boolean } = {}) {
  const deleted: string[] = [];
  const client: GeminiClient = {
    files: {
      upload: async () => ({ name: "files/abc", uri: "https://x/abc", mimeType: "application/pdf" }),
      delete: async ({ name }) => {
        deleted.push(name);
        return {};
      },
    },
    models: {
      generateContent: ({ config }) => {
        if (opts.hang) {
          return new Promise((_, reject) => {
            config?.abortSignal?.addEventListener("abort", () => reject(new Error("abortado")));
          });
        }
        if (opts.generateError) return Promise.reject(opts.generateError);
        return Promise.resolve({ text: opts.text ?? RESPONSE });
      },
    },
  };
  return { client, deleted };
}

test("devuelve el curso cuando Gemini responde bien", async () => {
  const { client } = fakeClient();
  const result = await generateCourse(client, PDF);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.course.name, "Curso de prueba");
  assert.equal(result.course.units[0].sessions[0].title, "Sesión 1");
});

test("borra de Gemini el PDF subido cuando todo sale bien", async () => {
  const { client, deleted } = fakeClient();
  await generateCourse(client, PDF);
  assert.deepEqual(deleted, ["files/abc"]);
});

test("falla sin lanzar error y borra el PDF cuando Gemini falla", async () => {
  const { client, deleted } = fakeClient({ generateError: new Error("503 sobrecargado") });
  const result = await generateCourse(client, PDF);
  assert.equal(result.ok, false);
  assert.deepEqual(deleted, ["files/abc"]);
});

test("falla cuando la respuesta de Gemini no se puede convertir en curso", async () => {
  const { client } = fakeClient({ text: "no es json" });
  assert.equal((await generateCourse(client, PDF)).ok, false);
  const empty = fakeClient({ text: JSON.stringify({ title: "X", content: [] }) });
  assert.equal((await generateCourse(empty.client, PDF)).ok, false);
});

test("corta la espera cuando Gemini no responde a tiempo", async () => {
  const { client, deleted } = fakeClient({ hang: true });
  const started = Date.now();
  const result = await generateCourse(client, PDF, { timeoutMs: 50 });
  assert.equal(result.ok, false);
  assert.ok(Date.now() - started < 2000, "no debe quedarse esperando");
  assert.deepEqual(deleted, ["files/abc"]);
});

test("no falla si borrar el PDF de Gemini da error", async () => {
  const { client } = fakeClient();
  client.files.delete = async () => {
    throw new Error("no se pudo borrar");
  };
  assert.equal((await generateCourse(client, PDF)).ok, true);
});
