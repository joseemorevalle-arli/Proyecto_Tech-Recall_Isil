"use server";

import { requireSession } from "@/lib/auth/session";
import { extractPdfText, looksLikePdf } from "@/lib/syllabus/extract-text";
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

// HU05: valida que el PDF subido sea un sílabo oficial de ISIL leyendo su contenido.
// No guarda nada: el curso se crea recién en la HU06.
export async function procesarYGuardarSilabo(formData: FormData): Promise<ResultadoProcesamiento> {
  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  await requireSession();

  const file = formData.get("silabo");
  if (!(file instanceof File) || file.size === 0) {
    return { exito: false, mensaje: "No se seleccionó ningún archivo." };
  }

  // 1. Solo PDF (por extensión; el contenido se comprueba más abajo)
  if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
    return { exito: false, mensaje: "Formato no permitido. Solo se aceptan archivos PDF." };
  }

  // 2. Tamaño máximo (5 MB)
  if (file.size > MAX_SIZE) {
    return { exito: false, mensaje: "El archivo excede el tamaño máximo permitido de 5MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Que sea realmente un PDF y no otro archivo con la extensión cambiada
    if (!looksLikePdf(buffer)) {
      return { exito: false, mensaje: "Formato no permitido. Solo se aceptan archivos PDF." };
    }

    // 4. Que el contenido sea el de un sílabo oficial de ISIL
    const texto = await extractPdfText(buffer);
    if (!isIsilSyllabus(texto)) {
      return {
        exito: false,
        mensaje:
          "El archivo PDF no cuenta con las secciones ni la estructura propia de un sílabo oficial de ISIL.",
      };
    }

    return {
      exito: true,
      mensaje: "¡Sílabo validado correctamente!",
      nombreArchivo: file.name,
    };
  } catch (error) {
    console.error("Error al procesar el sílabo:", error);
    return {
      exito: false,
      mensaje: "No se pudo leer el PDF. Revisa que no esté dañado e inténtalo de nuevo.",
    };
  }
}

// HU06 (pendiente): la generación del curso a partir del contenido del sílabo todavía no existe.
// Hasta entonces no se inventa un curso: se informa que aún no está disponible.
export async function generarEstructuraCurso(): Promise<ResultadoGeneracionCurso> {
  await requireSession();
  return {
    exito: false,
    mensaje: "La generación del curso todavía no está disponible. Llegará con la HU06.",
  };
}
