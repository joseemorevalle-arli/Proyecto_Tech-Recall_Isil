"use client";

import { useActionState } from "react";
import { AlertCircle, CircleCheck, Loader2, MailWarning, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, type ResendLinkState } from "./actions";

const initialState: ResendLinkState = {};

// HU04: aviso para las cuentas sin verificar, con «Reenviar enlace» (escenario 3)
export function EmailVerificationBanner({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initialState);

  return (
    <Alert className="border-amber-400/40">
      <MailWarning aria-hidden className="text-amber-400" />
      <AlertTitle>Verifica tu correo</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p className="break-words">
          Te enviamos un enlace a <strong className="font-medium text-foreground">{email}</strong>. Ábrelo para
          habilitar la generación de cursos, resúmenes y cuestionarios. Si ya lo abriste, recarga la página.
        </p>

        {!pending && state.status === "sent" && (
          <p role="status" className="flex items-start gap-2 text-green-400">
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.message}
          </p>
        )}
        {!pending && state.status === "error" && (
          <p role="alert" className="flex items-start gap-2 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.message}
          </p>
        )}

        <form action={formAction}>
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
            {pending ? "Enviando…" : "Reenviar enlace"}
          </Button>
        </form>
      </AlertDescription>
    </Alert>
  );
}
