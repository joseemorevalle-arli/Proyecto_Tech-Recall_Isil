"use client";

import { useActionState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { deleteClassAction, type DeleteClassState } from "./actions";

const initialState: DeleteClassState = {};

// Eliminar una clase no se puede deshacer: primero se pide confirmación
export function DeleteClassButton({
  courseId,
  classId,
  className,
}: {
  courseId: string;
  classId: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(deleteClassAction, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Eliminar la clase ${className}`} />}
      >
        <Trash2 aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta clase?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            Se borrará «{className}» y su enlace de Zoom. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.formError && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription className="text-destructive">{state.formError}</AlertDescription>
          </Alert>
        )}

        <form action={formAction}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="classId" value={classId} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Eliminando…" : "Sí, eliminar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
