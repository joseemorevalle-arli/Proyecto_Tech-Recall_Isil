"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CircleCheck, FileText, Info, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processClassAction, type ProcessClassState } from "./actions";

const initialState: ProcessClassState = {};

// HU09: pide la transcripción de la clase. Mientras el servicio trabaja (puede tardar por el arranque
// en frío) se muestra el avance; si falla, el mismo botón permite reintentar sin tocar el nombre ni el enlace.
export function ProcessClassButton({
  courseId,
  classId,
  className,
  transcribed,
  manualUploadHref,
}: {
  courseId: string;
  classId: string;
  className: string;
  // true si la clase ya tiene transcripción guardada
  transcribed: boolean;
  // HU17: en la lista del curso, enlace a la carga manual cuando Zoom no da la transcripción
  manualUploadHref?: string;
}) {
  const [state, formAction, pending] = useActionState(processClassAction, initialState);
  const isDone = transcribed || state.status === "done";

  return (
    <div className="flex flex-col items-start gap-2">
      {pending && (
        <div role="status" className="flex w-full flex-col gap-1.5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Obteniendo la transcripción… Puede tardar un par de minutos.
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      )}

      {!pending && isDone && (
        <p className="flex items-center gap-2 text-sm text-green-400">
          <CircleCheck className="size-4" aria-hidden />
          Transcripción lista
        </p>
      )}

      {!pending && state.status === "no-transcript" && (
        <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      {!pending && state.status === "error" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      {!pending && manualUploadHref && (state.status === "no-transcript" || state.status === "error") && (
        <Link href={manualUploadHref} className="text-sm text-primary underline-offset-4 hover:underline">
          Subir la transcripción manualmente
        </Link>
      )}

      {/* Una clase ya transcrita no vuelve a pedirse; las demás muestran Procesar o, tras un error, Reintentar */}
      {!isDone && (
        <form action={formAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="classId" value={classId} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`${state.status === "error" ? "Reintentar" : "Obtener la transcripción de"} la clase ${className}`}
          >
            {state.status === "error" ? <RotateCw aria-hidden /> : <FileText aria-hidden />}
            {pending ? "Procesando…" : state.status === "error" ? "Reintentar" : "Obtener transcripción"}
          </Button>
        </form>
      )}
    </div>
  );
}
