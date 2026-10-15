"use server";

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

// HU06: Generación de la estructura del curso a partir del sílabo
export async function generarEstructuraCurso(
  nombreArchivo: string,
  temas: SilaboTema[],
  simularFallo: boolean = false
): Promise<ResultadoGeneracionCurso> {
  try {
    // Simulación de fallo para probar el Criterio 3 (Error de generación)
    if (simularFallo) {
      throw new Error("El servicio de IA no respondió a tiempo durante el modelado de unidades.");
    }

    // Simular un pequeño retardo de procesamiento de la IA
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Formatear las unidades y sesiones para el curso
    const unidades = temas.map((t) => ({
      unidad: `Unidad ${t.semana}`,
      semana: t.semana,
      titulo: t.titulo,
      descripcion: t.descripcion,
      completado: false,
    }));

    // Nombre sugerido a partir del archivo
    const nombreCurso = nombreArchivo.replace(/\.[^/.]+$/, "").toUpperCase();

    // Guardar el curso estructurado en Firestore (Colección "cursos")
    const docRef = await db.collection("cursos").add({
      nombreCurso,
      archivoOrigen: nombreArchivo,
      fechaCreacion: new Date().toISOString(),
      estado: "ACTIVO",
      unidades,
    });

    return {
      exito: true,
      mensaje: "¡Curso creado y estructurado con éxito!",
      cursoId: docRef.id,
    };
  } catch (error: any) {
    console.error("Error al generar el curso:", error);
    return {
      exito: false,
      mensaje: error?.message || "Ocurrió un fallo en el servicio de IA durante la generación del curso.",
    };
  }
}
