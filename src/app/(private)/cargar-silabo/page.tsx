"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { FileDropzone } from "@/components/file-dropzone";
import { procesarYGuardarSilabo, generarEstructuraCurso } from "./actions";

export default function CargarSilaboPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [silaboValidado, setSilaboValidado] = useState(false);

  // Estados de la HU06 (la generación real llega en esa historia)
  const [generandoCurso, setGenerandoCurso] = useState(false);
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    // Al elegir otro archivo (o quitarlo) se pierde la validación anterior
    setArchivo(file);
    setSilaboValidado(false);
    setMensaje(null);
    setErrorGeneracion(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;

    setCargando(true);
    setMensaje(null);
    setSilaboValidado(false);
    setErrorGeneracion(null);

    const formData = new FormData();
    formData.append("silabo", archivo);

    try {
      const respuesta = await procesarYGuardarSilabo(formData);
      setMensaje({ tipo: respuesta.exito ? "exito" : "error", texto: respuesta.mensaje });
      setSilaboValidado(respuesta.exito);
    } catch {
      // Si la petición falla (red caída, archivo rechazado por el servidor), no se queda en silencio
      setMensaje({ tipo: "error", texto: "No se pudo validar el archivo. Inténtalo de nuevo." });
    } finally {
      setCargando(false);
    }
  };

  const handleGenerarCurso = async () => {
    setGenerandoCurso(true);
    setErrorGeneracion(null);

    const resultado = await generarEstructuraCurso();

    setGenerandoCurso(false);
    if (!resultado.exito) setErrorGeneracion(resultado.mensaje);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Carga y Validación del Sílabo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <Field>
              <FieldLabel htmlFor="silabo-file">
                Selecciona el archivo del sílabo oficial (PDF)
              </FieldLabel>
              <FileDropzone
                id="silabo-file"
                accept=".pdf"
                file={archivo}
                onFileChange={handleFileChange}
                disabled={cargando || generandoCurso}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={!archivo || cargando || generandoCurso}>
              {cargando ? "Validando sílabo..." : "Validar Sílabo"}
            </Button>
          </form>

          {mensaje && (
            <div
              role={mensaje.tipo === "error" ? "alert" : "status"}
              className={`p-4 rounded-md border text-center ${
                mensaje.tipo === "exito"
                  ? "bg-green-500/10 border-green-500 text-green-400"
                  : "bg-red-500/10 border-red-500 text-red-400"
              }`}
            >
              {mensaje.texto}
            </div>
          )}

          {/* Siempre visible: se habilita solo con un sílabo validado (HU05, escenarios 1 y 2) */}
          <Button
            type="button"
            onClick={handleGenerarCurso}
            className="w-full"
            disabled={!silaboValidado || generandoCurso}
          >
            {generandoCurso ? "Generando curso..." : "Generar Curso"}
          </Button>

          {errorGeneracion && (
            <div
              role="alert"
              className="p-4 rounded-md bg-red-500/10 border border-red-500 text-red-400 text-center text-sm"
            >
              {errorGeneracion}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
