"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CircleCheck, CircleX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CLASS_NAME_MAX_LENGTH,
  classSchema,
  ZOOM_RECORDING_PREFIX,
} from "@/lib/classes/schema";
import { registerClassAction, type RegisterClassState } from "./actions";

const initialState: RegisterClassState = {};

export function ClassForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(
    registerClassAction,
    initialState,
  );
  // Campos controlados: se validan con cada tecla y no se borran si el servidor responde con un error
  const [name, setName] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");

  // Mismo esquema que usa el servidor, aplicado campo por campo mientras el estudiante escribe
  const nameIsValid = classSchema.shape.name.safeParse(name).success;
  const zoomUrlCheck = classSchema.shape.zoomUrl.safeParse(zoomUrl);
  const zoomUrlIsEmpty = zoomUrl.trim() === "";
  // Criterio 3: el envío se habilita solo con el nombre escrito y un enlace válido
  const canSubmit = nameIsValid && zoomUrlCheck.success;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />

      {state.formError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription className="text-destructive">
            {state.formError}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre de la clase</Label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          placeholder="Ej.: Sesión 3: Modelo entidad-relación"
          maxLength={CLASS_NAME_MAX_LENGTH}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          disabled={pending}
          className="h-10"
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="zoomUrl">Enlace de la grabación de Zoom</Label>
        <Input
          id="zoomUrl"
          name="zoomUrl"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={`${ZOOM_RECORDING_PREFIX}...`}
          required
          value={zoomUrl}
          onChange={(event) => setZoomUrl(event.target.value)}
          aria-invalid={!zoomUrlIsEmpty && !zoomUrlCheck.success}
          aria-describedby="zoomUrl-status"
          disabled={pending}
          className="h-10"
        />
        {/* Criterio 2: el mensaje cambia mientras el estudiante escribe y el lector de pantalla lo anuncia */}
        <div id="zoomUrl-status" aria-live="polite">
          {zoomUrlIsEmpty ? (
            <p className="text-xs break-words text-muted-foreground">
              Cópialo desde Zoom. Debe empezar con {ZOOM_RECORDING_PREFIX}
            </p>
          ) : zoomUrlCheck.success ? (
            <p className="flex items-center gap-1.5 text-sm text-green-400">
              <CircleCheck className="size-4 shrink-0" aria-hidden />
              Enlace de Zoom válido
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">
                {zoomUrlCheck.error.issues[0]?.message}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          className="h-10 w-full"
          disabled={!canSubmit || pending}
          aria-describedby={canSubmit ? undefined : "submit-hint"}
        >
          {pending ? "Registrando clase…" : "Registrar clase"}
        </Button>
        {!canSubmit && (
          <p
            id="submit-hint"
            className="text-center text-xs text-muted-foreground"
          >
            {missingFieldsHint(nameIsValid, zoomUrlCheck.success)}
          </p>
        )}
      </div>
    </form>
  );
}

// Explica por qué el botón sigue deshabilitado
function missingFieldsHint(nameIsValid: boolean, zoomUrlIsValid: boolean) {
  if (!nameIsValid && !zoomUrlIsValid) {
    return "Escribe el nombre de la clase y pega un enlace válido para continuar.";
  }
  if (!nameIsValid) return "Escribe el nombre de la clase para continuar.";
  return "Pega un enlace válido de la grabación para continuar.";
}
