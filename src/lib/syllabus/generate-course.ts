import { mapGeminiCourse, type MapResult } from "./map-course.ts";

// Lo mínimo que se usa del cliente de Gemini. Así las pruebas inyectan uno falso, sin red.
export interface GeminiClient {
  files: {
    upload(params: { file: Blob; config?: { mimeType?: string } }): Promise<{
      name?: string;
      uri?: string;
      mimeType?: string;
    }>;
    delete(params: { name: string }): Promise<unknown>;
  };
  models: {
    generateContent(params: {
      model: string;
      contents: unknown;
      config?: { abortSignal?: AbortSignal; [key: string]: unknown };
    }): Promise<{ text?: string }>;
  };
}

// Se probó con la clave del proyecto: "gemini-flash-latest" se colgaba o respondía 503 y
// "gemini-2.5-flash" ya no está disponible para cuentas nuevas. Si Google retira este modelo, cambiar aquí.
export const GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_TIMEOUT_MS = 60_000;

// Esquema de la respuesta (JSON). Los nombres en español son los que se piden en el prompt.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["title", "content"],
  properties: {
    title: { type: "STRING", description: "Nombre completo del curso." },
    content: {
      type: "ARRAY",
      description: "Unidades de aprendizaje del curso, en el orden del sílabo.",
      items: {
        type: "OBJECT",
        required: ["title", "sesiones"],
        properties: {
          title: { type: "STRING", description: "Título de la unidad." },
          descripcion: { type: "STRING", description: "Indicador de logro de la unidad." },
          sesiones: {
            type: "ARRAY",
            description: "Sesiones de la unidad, en el orden del sílabo.",
            items: {
              type: "OBJECT",
              required: ["tema"],
              properties: {
                tema: { type: "STRING", description: "Tema de la sesión (contenido conceptual)." },
                descripcion: { type: "STRING", description: "Descripción de la sesión." },
              },
            },
          },
        },
      },
    },
  },
};

const PROMPT = `Eres un asistente que extrae la estructura de un sílabo oficial de ISIL. Lee el PDF adjunto y devuelve SOLO un JSON con esta forma:

{
  "title": "Nombre completo del curso",
  "content": [
    {
      "title": "Título de la unidad de aprendizaje",
      "descripcion": "Indicador de logro de la unidad",
      "sesiones": [
        { "tema": "Tema de la sesión (contenido conceptual)", "descripcion": "Descripción de la sesión" }
      ]
    }
  ]
}

Reglas:
- Usa exactamente los nombres, unidades y temas que figuran en el sílabo, sin inventar, resumir ni reordenar.
- Las unidades y las sesiones van en el mismo orden que en el sílabo.
- Cada sesión es una fila de la tabla «Programación de contenidos».
- Si algo no aparece en el sílabo, déjalo como texto vacío; no lo inventes.`;

export type GenerateResult = MapResult;

// Sube el PDF a Gemini, pide la estructura del curso y borra el archivo subido al terminar.
// Nunca lanza error: cualquier fallo (red, timeout, respuesta inválida) devuelve { ok: false }.
export async function generateCourse(
  client: GeminiClient,
  pdf: Blob,
  options: { timeoutMs?: number } = {},
): Promise<GenerateResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let uploadedName: string | undefined;

  try {
    const uploaded = await client.files.upload({
      file: pdf,
      config: { mimeType: "application/pdf" },
    });
    uploadedName = uploaded.name;

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } },
            { text: PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });

    return mapGeminiCourse(response.text ?? "");
  } catch (error) {
    // Solo el nombre del error: el mensaje podría traer datos de la petición
    console.error("Error al generar el curso con Gemini:", error instanceof Error ? error.name : "desconocido");
    return { ok: false };
  } finally {
    clearTimeout(timer);
    if (uploadedName) {
      // Se borra el PDF de Google; si no se puede, no importa (Gemini lo borra solo a las 48 h)
      await client.files.delete({ name: uploadedName }).catch(() => undefined);
    }
  }
}
