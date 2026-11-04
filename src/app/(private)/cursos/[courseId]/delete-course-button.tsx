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
import { deleteCourseAction, type DeleteCourseState } from "./actions";

const initialState: DeleteCourseState = {};

// Eliminar un curso no se puede deshacer: primero se pide confirmación y se dice qué se pierde
export function DeleteCourseButton({
  courseId,
  courseName,
  classCount,
}: {
  courseId: string;
  courseName: string;
  classCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteCourseAction, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="lg" />}>
        <Trash2 aria-hidden />
        Eliminar curso
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            Se borrará «{courseName}» con sus unidades y sesiones
            {classCount > 0
              ? ` y sus ${classCount} ${classCount === 1 ? "clase registrada" : "clases registradas"}`
              : ""}
            . Esta acción no se puede deshacer.
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
