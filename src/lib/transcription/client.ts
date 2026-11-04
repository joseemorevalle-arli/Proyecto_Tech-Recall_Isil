import { countCues, isAllowedVttUrl } from "./vtt.ts";

// Mensajes que ve el estudiante. El de «sin transcripción» es el del criterio de aceptación (HU09, escenario 3).
export const TRANSCRIPT_MESSAGES = {
  noTranscript: "Esta grabación no tiene transcripción disponible",
  serviceUnavailable:
    "No pudimos obtener la transcripción. El servicio puede estar iniciando; inténtalo de nuevo en un minuto.",
  tooLarge: "La transcripción de esta clase es demasiado larga para guardarse.",
} as const;

// Firestore admite documentos de hasta 1 MiB; se deja margen para el resto de los campos de la clase.
export const MAX_VTT_BYTES = 800_000;

// Margen para el arranque en frío del microservicio (Render) más el tiempo que Zoom tarda en responder
const DEFAULT_TIMEOUT_MS = 120_000;
const VTT_DOWNLOAD_TIMEOUT_MS = 30_000;

export type TranscriptionConfig = {
  serviceUrl: string;
  apiKey: string;
  timeoutMs: number;
};

export type TranscriptResult =
  | { status: "ready"; vtt: string }
  | { status: "no-transcript" }
  | { status: "error"; message: string };

// La URL del microservicio y la clave compartida salen solo de variables de entorno del servidor
export function transcriptionConfigFromEnv(): TranscriptionConfig {
  return {
    serviceUrl: process.env.TRANSCRIPTION_SERVICE_URL?.trim() ?? "",
    apiKey: process.env.TRANSCRIPTION_API_KEY?.trim() ?? "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

const SERVICE_ERROR: TranscriptResult = {
  status: "error",
  message: TRANSCRIPT_MESSAGES.serviceUnavailable,
};

// Pide al microservicio la dirección del VTT de la grabación y descarga el archivo.
// Nunca lanza: devuelve el resultado ya clasificado. Los errores se registran sin el enlace ni la clave,
// porque el enlace de Zoom lleva un token de acceso.
export async function fetchTranscript(
  zoomUrl: string,
  config: TranscriptionConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<TranscriptResult> {
  if (!config.serviceUrl || !config.apiKey) {
    console.error("Transcripción: faltan TRANSCRIPTION_SERVICE_URL o TRANSCRIPTION_API_KEY.");
    return SERVICE_ERROR;
  }

  try {
    const endpoint = `${config.serviceUrl.replace(/\/+$/, "")}/api/transcription/v3`;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-service-key": config.apiKey },
      body: JSON.stringify({ zoomLink: zoomUrl }),
      signal: AbortSignal.timeout(config.timeoutMs),
      cache: "no-store",
    });

    // El servicio responde 404 con un JSON cuando la grabación no tiene subtítulos.
    // Un 404 sin JSON (ruta inexistente) es una falla del servicio, no una grabación sin transcripción.
    if (response.status === 404) {
      const body = await response.json().catch(() => null);
      if (body && typeof body === "object" && "ok" in body) return { status: "no-transcript" };
      console.error("Transcripción: el servicio respondió 404 sin el formato esperado.");
      return SERVICE_ERROR;
    }
    if (!response.ok) {
      console.error(`Transcripción: el servicio respondió ${response.status}.`);
      return SERVICE_ERROR;
    }

    const body: unknown = await response.json();
    const vttUrl =
      body && typeof body === "object" && "vttUrl" in body ? (body as { vttUrl: unknown }).vttUrl : null;
    if (typeof vttUrl !== "string" || vttUrl === "") return { status: "no-transcript" };
    if (!isAllowedVttUrl(vttUrl)) {
      console.error("Transcripción: el servicio devolvió una dirección de VTT no permitida.");
      return SERVICE_ERROR;
    }

    const vttResponse = await fetchImpl(vttUrl, {
      signal: AbortSignal.timeout(VTT_DOWNLOAD_TIMEOUT_MS),
      redirect: "error",
      cache: "no-store",
    });
    if (!vttResponse.ok) {
      console.error(`Transcripción: la descarga del VTT respondió ${vttResponse.status}.`);
      return SERVICE_ERROR;
    }

    const vtt = await vttResponse.text();
    if (!vtt.trimStart().startsWith("WEBVTT")) {
      console.error("Transcripción: la respuesta descargada no es un archivo VTT.");
      return SERVICE_ERROR;
    }
    if (countCues(vtt) === 0) return { status: "no-transcript" };
    if (Buffer.byteLength(vtt, "utf8") > MAX_VTT_BYTES) {
      return { status: "error", message: TRANSCRIPT_MESSAGES.tooLarge };
    }
    return { status: "ready", vtt };
  } catch (error) {
    // Solo el nombre del error: su mensaje puede traer el enlace de Zoom con su token
    console.error("Transcripción: falló la solicitud:", error instanceof Error ? error.name : "desconocido");
    return SERVICE_ERROR;
  }
}
