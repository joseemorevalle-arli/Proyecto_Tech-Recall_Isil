"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { procesarYGuardarSilabo, SilaboTema } from "./actions";

export default function CargarSilaboPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [temas, setTemas] = useState<SilaboTema[]>([]);
  const [silaboValidado, setSilaboValidado] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setSilaboValidado(false); // Resetear validación al cambiar de archivo
      setTemas([]);
      setMensaje(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;

    setCargando(true);
    setMensaje(null);
    setTemas([]);
    setSilaboValidado(false);

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

  const handleGenerarCurso = () => {
    alert("¡Redirigiendo a la generación del curso con los datos del sílabo!");
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Carga y Validación del Sílabo (HU05)
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
                disabled={cargando}
              />
              <p className="text-xs text-zinc-500">
                Tip de prueba: Si quieres probar el escenario de error, sube un PDF cuyo nombre incluya la palabra &quot;factura&quot; o &quot;error&quot;.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={!archivo || cargando}>
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

      {/* Estructura extraída y Botón de Generar Curso */}
      {temas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Estructura Extraída por la IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {temas.map((item) => (
                <div key={item.semana} className="p-4 border rounded-lg bg-zinc-900/50">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-900 text-blue-300">
                    Semana {item.semana}
                  </span>
                  <h3 className="text-lg font-medium mt-2">{item.titulo}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{item.descripcion}</p>
                </div>
              ))}
            </div>

            {/* Botón condicional según el criterio de aceptación */}
            <Button 
              onClick={handleGenerarCurso} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              disabled={!silaboValidado}
            >
              Generar Curso 🚀
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}