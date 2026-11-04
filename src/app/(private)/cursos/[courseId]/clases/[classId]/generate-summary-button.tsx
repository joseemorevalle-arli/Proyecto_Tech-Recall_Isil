"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSummaryAction, type GenerateSummaryState } from "./summary-actions";

const initialState: GenerateSummaryState = {};

// HU10: genera el resumen de la clase. Al terminar, la página se actualiza y muestra los temas.
// Mientras la IA trabaja se muestra el avance; si falla, el mismo botón permite reintentar.
export function GenerateSummaryButton({
  courseId,
  classId,
  className,
}: {
  courseId: string;
  classId: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(generateSummaryAction, initialState);
  const failed = state.status === "error";

  return (
    <div className="flex flex-col items-center gap-2">
      {pending && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Generando el resumen… Puede tardar hasta un minuto.
        </p>
      )}

      {!pending && failed && (
        <p role="alert" className="flex items-start gap-2 text-left text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="classId" value={classId} />
        <Button
          type="submit"
          disabled={pending}
          aria-label={`${failed ? "Reintentar el resumen" : "Generar el resumen"} de la clase ${className}`}
        >
          {failed ? <RotateCw aria-hidden /> : <Sparkles aria-hidden />}
          {pending ? "Generando…" : failed ? "Reintentar" : "Generar resumen"}
        </Button>
      </form>
    </div>
  );
}
