import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fetchTranscript,
  TRANSCRIPT_MESSAGES,
  type TranscriptionConfig,
} from "./client.ts";

const ZOOM_URL = "https://isil-pe.zoom.us/rec/play/AbC123-xyz.456?token=SECRETO-DEL-ENLACE";
const VTT_URL = "https://isil-pe.zoom.us/rec/play/vtt?type=transcript&meetingId=abc";
const VTT = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHola a todos\n";

const config: TranscriptionConfig = {
  serviceUrl: "https://servicio.example.com",
  apiKey: "clave-compartida",
  timeoutMs: 1000,
};

type Call = { url: string; init?: RequestInit };

// fetch simulado: responde en orden y guarda cada llamada para revisarla
function fakeFetch(...responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const impl = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const next = responses.shift();
    if (!next) throw new Error("llamada inesperada");
    if (next instanceof Error) throw next;
    return next;
  };
  return { impl: impl as typeof fetch, calls };
}

function serviceOk(vttUrl: string | null = VTT_URL) {
  return Response.json({ ok: true, vttUrl, error: null });
}

test("obtiene el VTT: pide la URL al servicio y descarga el archivo", async () => {
  const { impl, calls } = fakeFetch(serviceOk(), new Response(VTT));
  const result = await fetchTranscript(ZOOM_URL, config, impl);

  assert.deepEqual(result, { status: "ready", vtt: VTT });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://servicio.example.com/api/transcription/v3");
  assert.equal(calls[0].init?.method, "POST");
  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get("x-service-key"), "clave-compartida");
  assert.equal(headers.get("authorization"), null);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { zoomLink: ZOOM_URL });
  assert.equal(calls[1].url, VTT_URL);
});

test("tolera una barra final en la URL del servicio", async () => {
  const { impl, calls } = fakeFetch(serviceOk(), new Response(VTT));
  await fetchTranscript(ZOOM_URL, { ...config, serviceUrl: "https://servicio.example.com/" }, impl);
  assert.equal(calls[0].url, "https://servicio.example.com/api/transcription/v3");
});

test("la grabación sin subtítulos (404 del servicio) no es un error y no descarga nada", async () => {
  const { impl, calls } = fakeFetch(
    Response.json({ ok: false, vttUrl: null, error: { message: "No se encontro" } }, { status: 404 }),
  );
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  assert.deepEqual(result, { status: "no-transcript" });
  assert.equal(calls.length, 1);
});

test("un VTT sin intervenciones cuenta como grabación sin transcripción", async () => {
  const { impl } = fakeFetch(serviceOk(), new Response("WEBVTT\n\n"));
  assert.deepEqual(await fetchTranscript(ZOOM_URL, config, impl), { status: "no-transcript" });
});

test("si el servicio falla (500) se informa el error para reintentar", async () => {
  const { impl } = fakeFetch(
    Response.json({ ok: false, vttUrl: null, error: { message: "boom" } }, { status: 500 }),
  );
  assert.deepEqual(await fetchTranscript(ZOOM_URL, config, impl), {
    status: "error",
    message: TRANSCRIPT_MESSAGES.serviceUnavailable,
  });
});

test("si el servicio rechaza la clave (401) es un error, no una grabación sin transcripción", async () => {
  const { impl } = fakeFetch(Response.json({ ok: false }, { status: 401 }));
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  assert.equal(result.status, "error");
});

test("si no hay conexión con el servicio es un error", async () => {
  const { impl } = fakeFetch(new TypeError("fetch failed"));
  assert.deepEqual(await fetchTranscript(ZOOM_URL, config, impl), {
    status: "error",
    message: TRANSCRIPT_MESSAGES.serviceUnavailable,
  });
});

test("si el servicio tarda más del tiempo máximo (arranque en frío) es un error", async () => {
  const slow = (async (_input: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    })) as typeof fetch;
  const result = await fetchTranscript(ZOOM_URL, { ...config, timeoutMs: 20 }, slow);
  assert.deepEqual(result, { status: "error", message: TRANSCRIPT_MESSAGES.serviceUnavailable });
});

test("sin URL o sin clave del servicio no se llama a nadie", async () => {
  for (const partial of [{ serviceUrl: "" }, { apiKey: "" }]) {
    const { impl, calls } = fakeFetch();
    const result = await fetchTranscript(ZOOM_URL, { ...config, ...partial }, impl);
    assert.deepEqual(result, { status: "error", message: TRANSCRIPT_MESSAGES.serviceUnavailable });
    assert.equal(calls.length, 0);
  }
});

test("no descarga una URL de VTT que no sea de Zoom", async () => {
  const { impl, calls } = fakeFetch(serviceOk("https://evil.com/rec/play/vtt?type=transcript"));
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  assert.equal(result.status, "error");
  assert.equal(calls.length, 1);
});

test("si la descarga del VTT falla es un error", async () => {
  const { impl } = fakeFetch(serviceOk(), new Response("denegado", { status: 403 }));
  assert.deepEqual(await fetchTranscript(ZOOM_URL, config, impl), {
    status: "error",
    message: TRANSCRIPT_MESSAGES.serviceUnavailable,
  });
});

test("una respuesta que no es un VTT (por ejemplo, una página HTML) es un error", async () => {
  const { impl } = fakeFetch(serviceOk(), new Response("<html>Inicia sesión</html>"));
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  assert.equal(result.status, "error");
});

test("un VTT demasiado grande para guardarse es un error", async () => {
  const huge = `WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n${"a".repeat(900_000)}\n`;
  const { impl } = fakeFetch(serviceOk(), new Response(huge));
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  assert.deepEqual(result, { status: "error", message: TRANSCRIPT_MESSAGES.tooLarge });
});

test("los mensajes de error no filtran la clave ni el token del enlace de Zoom", async () => {
  const { impl } = fakeFetch(new Error(`falló ${ZOOM_URL} con ${config.apiKey}`));
  const result = await fetchTranscript(ZOOM_URL, config, impl);
  const text = JSON.stringify(result);
  assert.equal(text.includes("SECRETO-DEL-ENLACE"), false);
  assert.equal(text.includes("clave-compartida"), false);
});

test("el mensaje de grabación sin transcripción es el del criterio de aceptación", () => {
  assert.equal(
    TRANSCRIPT_MESSAGES.noTranscript,
    "Esta grabación no tiene transcripción disponible",
  );
});
