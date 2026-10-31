"use client";

import { useActionState } from "react";
import { AlertCircle, ListChecks, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuizAction, type GenerateQuizState } from "./actions";

const initialState: GenerateQuizState = {};

// HU11: genera el cuestionario de la clase. Al terminar, la acción lleva a la pantalla del cuestionario.
// Mientras la IA trabaja se muestra el avance; si falla, el mismo botón permite reintentar.
export function GenerateQuizButton({
  courseId,
  classId,
  className,
}: {
  courseId: string;
  classId: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(generateQuizAction, initialState);
  const failed = Boolean(state.formError);

  return (
    <div className="flex flex-col items-start gap-2">
      {pending && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Generando el cuestionario… Puede tardar hasta un minuto.
        </p>
      )}

      {!pending && failed && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.formError}
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="classId" value={classId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          aria-label={`${failed ? "Reintentar el cuestionario" : "Generar el cuestionario"} de la clase ${className}`}
        >
          {failed ? <RotateCw aria-hidden /> : <ListChecks aria-hidden />}
          {pending ? "Generando…" : failed ? "Reintentar" : "Generar cuestionario"}
        </Button>
      </form>
    </div>
  );
}
