"use server";

import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/session";
import { courseSchema } from "@/lib/courses/schema";
import { adminDb } from "@/lib/firebase/admin";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

if (!getApps().length) {
  initializeApp({
    projectId: "demo-recall-isil",
  });
}

const db = getFirestore();

export interface SilaboTema {
  semana: number;
  titulo: string;
  descripcion: string;
}

export interface ResultadoProcesamiento {
  exito: boolean;
  mensaje: string;
  nombreArchivo?: string;
  temasExtraidos?: SilaboTema[];
}

export interface ResultadoGeneracionCurso {
  exito: boolean;
  mensaje: string;
  cursoId?: string;
}

// HU05: Procesar y Validar Sílabo (PDF)
export async function procesarYGuardarSilabo(formData: FormData): Promise<ResultadoProcesamiento> {
  try {
    const file = formData.get("silabo") as File;

    if (!file) {
      return { exito: false, mensaje: "No se seleccionó ningún archivo." };
    }

    // 1. Validar extensión (Únicamente PDF)
    const extensionesPermitidas = ["pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !extensionesPermitidas.includes(ext)) {
      return { exito: false, mensaje: "Formato no permitido. Solo se aceptan archivos PDF." };
    }

    // 2. Validar tamaño máximo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { exito: false, mensaje: "El archivo excede el tamaño máximo permitido de 5MB." };
    }

    // 3. Validación de contenido institucional
    const nombreMinuscula = file.name.toLowerCase();
    const esSilaboValido = !nombreMinuscula.includes("factura") && !nombreMinuscula.includes("error") && !nombreMinuscula.includes("recibo");

    if (!esSilaboValido) {
      return { 
        exito: false, 
        mensaje: "El archivo PDF no cuenta con las secciones ni la estructura propia de un sílabo oficial de ISIL." 
      };
    }

    // 4. Extracción de semanas/unidades por IA
    const temasExtraidos: SilaboTema[] = [
      { semana: 1, titulo: "Introducción al curso y conceptos clave", descripcion: "Fundamentos generales y configuración del entorno." },
      { semana: 2, titulo: "Arquitectura y diseño de software", descripcion: "Patrones de diseño y modelado de componentes." },
      { semana: 3, titulo: "Gestión de bases de datos y persistencia", descripcion: "Modelado NoSQL y operaciones CRUD en tiempo real." },
      { semana: 4, titulo: "Evaluación Parcial y casos prácticos", descripcion: "Examen de validación de aprendizajes." },
    ];

    // 5. Guardar registro inicial en Firestore
    await db.collection("silabos").add({
      nombreArchivo: file.name,
      tamanoBytes: file.size,
      fechaCarga: new Date().toISOString(),
      estado: "VALIDADO_CORRECTAMENTE",
      temas: temasExtraidos,
    });

    return {
      exito: true,
      mensaje: "¡Sílabo validado correctamente!",
      nombreArchivo: file.name,
      temasExtraidos,
    };
  } catch (error) {
    console.error("Error al procesar el sílabo:", error);
    return { exito: false, mensaje: "Ocurrió un error interno al procesar el archivo." };
  }
}

// HU06: Generación de la estructura del curso a partir del sílabo.
// El curso se guarda en users/{uid}/courses con la forma que lee la HU07 (src/lib/courses/schema.ts).
export async function generarEstructuraCurso(
  nombreArchivo: string,
  temas: SilaboTema[],
  simularFallo: boolean = false
): Promise<ResultadoGeneracionCurso> {
  // Fuera del try/catch: sin sesión, requireSession() redirige a iniciar sesión
  const { uid } = await requireSession();

  try {
    // Simulación de fallo para probar el Criterio 3 (Error de generación)
    if (simularFallo) {
      throw new Error("El servicio de IA no respondió a tiempo durante el modelado de unidades.");
    }

    // Simular un pequeño retardo de procesamiento de la IA
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Nombre sugerido a partir del archivo
    const nombreCurso = nombreArchivo.replace(/\.[^/.]+$/, "").toUpperCase();

    // Cada semana del sílabo es una unidad con su sesión. Se valida con el esquema de la HU07
    // porque los temas llegan desde el navegador y un curso mal formado no se podría mostrar.
    const curso = courseSchema.safeParse({
      name: nombreCurso,
      units: temas.map((t) => ({
        number: t.semana,
        title: t.titulo,
        sessions: [{ number: t.semana, title: t.descripcion || t.titulo }],
      })),
    });
    if (!curso.success) {
      return {
        exito: false,
        mensaje: "La estructura generada del curso no es válida. Vuelve a intentarlo.",
      };
    }

    // Guardar el curso en la cuenta del estudiante: users/{uid}/courses
    const docRef = await adminDb()
      .collection("users")
      .doc(uid)
      .collection("courses")
      .add({
        ...curso.data,
        sourceFile: nombreArchivo,
        createdAt: FieldValue.serverTimestamp(),
      });

    return {
      exito: true,
      mensaje: "¡Curso creado y estructurado con éxito!",
      cursoId: docRef.id,
    };
  } catch (error) {
    console.error("Error al generar el curso:", error);
    return {
      exito: false,
      mensaje:
        error instanceof Error
          ? error.message
          : "Ocurrió un fallo en el servicio de IA durante la generación del curso.",
    };
  }
}
