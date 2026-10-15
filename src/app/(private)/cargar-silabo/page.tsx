"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { procesarYGuardarSilabo, generarEstructuraCurso, SilaboTema } from "./actions";

export default function CargarSilaboPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [temas, setTemas] = useState<SilaboTema[]>([]);
  const [silaboValidado, setSilaboValidado] = useState(false);

  // Estados propios de la HU06
  const [generandoCurso, setGenerandoCurso] = useState(false);
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);
  const [cursoCreado, setCursoCreado] = useState<boolean>(false);
  const [simularErrorIA, setSimularErrorIA] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setSilaboValidado(false);
      setTemas([]);
      setMensaje(null);
      setErrorGeneracion(null);
      setCursoCreado(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;

    setCargando(true);
    setMensaje(null);
    setTemas([]);
    setSilaboValidado(false);
    setErrorGeneracion(null);
    setCursoCreado(false);

    const formData = new FormData();
    formData.append("silabo", archivo);

    const respuesta = await procesarYGuardarSilabo(formData);

    setCargando(false);
    if (respuesta.exito) {
      setMensaje({ tipo: "exito", texto: respuesta.mensaje });
      setSilaboValidado(true);
      if (respuesta.temasExtraidos) {
        setTemas(respuesta.temasExtraidos);
      }
    } else {
      setMensaje({ tipo: "error", texto: respuesta.mensaje });
      setSilaboValidado(false);
    }
  };

  // HU06: Manejador para la creación del curso
  const handleGenerarCurso = async () => {
    if (!archivo || temas.length === 0) return;

    setGenerandoCurso(true);
    setErrorGeneracion(null);

    const resultado = await generarEstructuraCurso(archivo.name, temas, simularErrorIA);

    setGenerandoCurso(false);

    if (resultado.exito) {
      setCursoCreado(true);
    } else {
      setErrorGeneracion(resultado.mensaje);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* HU05: Carga del Sílabo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Carga y Validación del Sílabo 
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="silabo-file">Selecciona el archivo del sílabo oficial (PDF)</Label>
              <Input
                id="silabo-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={cargando || generandoCurso}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!archivo || cargando || generandoCurso}>
              {cargando ? "Validando sílabo con IA..." : "Validar Sílabo"}
            </Button>
          </form>

          {mensaje && (
            <div
              className={`mt-6 p-4 rounded-md border text-center ${
                mensaje.tipo === "exito"
                  ? "bg-green-500/10 border-green-500 text-green-400"
                  : "bg-red-500/10 border-red-500 text-red-400"
              }`}
            >
              {mensaje.texto}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HU06: Generación y Vista de Unidades del Curso */}
      {temas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex justify-between items-center">
              <span>Estructura del Curso Generada</span>
              {/* Interruptor opcional para probar el Criterio 3 (Error de IA) */}
              <label className="text-xs font-normal flex items-center gap-2 cursor-pointer text-zinc-400">
                <input
                  type="checkbox"
                  checked={simularErrorIA}
                  onChange={(e) => setSimularErrorIA(e.target.checked)}
                />
                Simular error de IA
              </label>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {temas.map((item) => (
                <div key={item.semana} className="p-4 border rounded-lg bg-zinc-900/50">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-900 text-blue-300">
                    Unidad / Semana {item.semana}
                  </span>
                  <h3 className="text-lg font-medium mt-2">{item.titulo}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{item.descripcion}</p>
                </div>
              ))}
            </div>

            {/* Mensaje de Error en la Generación (Criterio 3) */}
            {errorGeneracion && (
              <div className="p-4 rounded-md bg-red-500/10 border border-red-500 text-red-400 text-center space-y-2">
                <p className="font-semibold"> Error en la generación del curso:</p>
                <p className="text-sm">{errorGeneracion}</p>
              </div>
            )}

            {/* Vista de Éxito al Generar (Criterio 1) */}
            {cursoCreado ? (
              <div className="p-4 rounded-md bg-green-500/10 border border-green-500 text-green-400 text-center font-semibold">
                ¡Curso armado con éxito y guardado en tu cuenta! Puedes empezar a repasar tus unidades. 🎉
              </div>
            ) : (
              /* Botón con estado de carga y reintento (Criterio 2 y 3) */
              <Button
                onClick={handleGenerarCurso}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                disabled={!silaboValidado || generandoCurso}
              >
                {generandoCurso
                  ? "Armando curso y unidades (Generando en proceso...)"
                  : errorGeneracion
                  ? "Reintentar Generar Curso "
                  : "Generar Curso "}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
