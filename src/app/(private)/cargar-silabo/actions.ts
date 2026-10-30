"use server";

import { GoogleGenAI } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { extractPdfText, looksLikePdf } from "@/lib/syllabus/extract-text";
import { generateCourse, type GeminiClient } from "@/lib/syllabus/generate-course";
import { isIsilSyllabus } from "@/lib/syllabus/validate";

export interface ResultadoProcesamiento {
  exito: boolean;
  mensaje: string;
  nombreArchivo?: string;
}

export interface ResultadoGeneracionCurso {
  exito: boolean;
  mensaje: string;
  cursoId?: string;
}

const MAX_SIZE = 5 * 1024 * 1024;

const MSG = {
  noFile: "No se seleccionó ningún archivo.",
  notPdf: "Formato no permitido. Solo se aceptan archivos PDF.",
  tooBig: "El archivo excede el tamaño máximo permitido de 5MB.",
  notSyllabus:
    "El archivo PDF no cuenta con las secciones ni la estructura propia de un sílabo oficial de ISIL.",
  unreadable: "No se pudo leer el PDF. Revisa que no esté dañado e inténtalo de nuevo.",
  generateFailed: "No se pudo generar el curso. Inténtalo de nuevo.",
} as const;

type Validacion = { ok: true; buffer: Buffer } | { ok: false; mensaje: string };

// Las mismas comprobaciones de la HU05. La generación las repite en el servidor
// porque el navegador podría mandar cualquier archivo.
async function validarSilabo(formData: FormData): Promise<Validacion> {
  const file = formData.get("silabo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, mensaje: MSG.noFile };

  // Solo PDF (por extensión; el contenido se comprueba más abajo)
  if (file.name.split(".").pop()?.toLowerCase() !== "pdf") return { ok: false, mensaje: MSG.notPdf };
  if (file.size > MAX_SIZE) return { ok: false, mensaje: MSG.tooBig };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Que sea realmente un PDF y no otro archivo con la extensión cambiada
    if (!looksLikePdf(buffer)) return { ok: false, mensaje: MSG.notPdf };
    if (!isIsilSyllabus(await extractPdfText(buffer))) return { ok: false, mensaje: MSG.notSyllabus };
    return { ok: true, buffer };
  } catch (error) {
    console.error("Error al procesar el sílabo:", error instanceof Error ? error.name : "desconocido");
    return { ok: false, mensaje: MSG.unreadable };
  }
}

// HU05: valida que el PDF subido sea un sílabo oficial de ISIL leyendo su contenido.
// No guarda nada: el curso se crea al pulsar «Generar Curso» (HU06).
export async function procesarYGuardarSilabo(formData: FormData): Promise<ResultadoProcesamiento> {
  // Sin sesión, requireSession() redirige a iniciar sesión
  await requireSession();

  const validacion = await validarSilabo(formData);
  if (!validacion.ok) return { exito: false, mensaje: validacion.mensaje };

  const file = formData.get("silabo") as File;
  return { exito: true, mensaje: "¡Sílabo validado correctamente!", nombreArchivo: file.name };
}

// HU06: genera el curso (unidades y sesiones) a partir del sílabo con Gemini y lo guarda en
// users/{uid}/courses con la forma que lee la HU07 (src/lib/courses/schema.ts).
export async function generarEstructuraCurso(formData: FormData): Promise<ResultadoGeneracionCurso> {
  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  const { uid } = await requireSession();

  const validacion = await validarSilabo(formData);
  if (!validacion.ok) return { exito: false, mensaje: validacion.mensaje };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno GEMINI_API_KEY.");
    return { exito: false, mensaje: MSG.generateFailed };
  }

  const file = formData.get("silabo") as File;
  const client = new GoogleGenAI({ apiKey }) as unknown as GeminiClient;
  const pdf = new Blob([new Uint8Array(validacion.buffer)], { type: "application/pdf" });

  const generado = await generateCourse(client, pdf);
  if (!generado.ok) return { exito: false, mensaje: MSG.generateFailed };

  try {
    const docRef = await adminDb()
      .collection("users")
      .doc(uid)
      .collection("courses")
      .add({
        ...generado.course,
        sourceFile: file.name,
        createdAt: FieldValue.serverTimestamp(),
      });
    return { exito: true, mensaje: "¡Curso creado y guardado en tu cuenta!", cursoId: docRef.id };
  } catch (error) {
    console.error("Error al guardar el curso:", error instanceof Error ? error.name : "desconocido");
    return { exito: false, mensaje: MSG.generateFailed };
  }
}
