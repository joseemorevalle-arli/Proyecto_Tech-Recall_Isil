"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildRegisterSchema,
  firstErrors,
  PASSWORD_MIN_LENGTH,
  type FieldErrors,
  type RegisterInput,
} from "@/lib/auth/schemas";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = { email: "" };

export function RegisterForm({ domains }: { domains: string[] }) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  // El correo es controlado: React 19 reinicia el <form> al terminar la acción y así no se pierde
  const [email, setEmail] = useState("");
  // Errores encontrados en el navegador antes de enviar
  const [clientErrors, setClientErrors] =
    useState<FieldErrors<RegisterInput> | null>(null);

  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const result = buildRegisterSchema(domains).safeParse({
      email: data.get("email"),
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    });
    if (!result.success) {
      event.preventDefault(); // no se envía al servidor
      setClientErrors(firstErrors(result.error));
      return;
    }
    setClientErrors(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {state.formError && !clientErrors && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription className="text-destructive">
            <p>{state.formError}</p>
            {state.emailAlreadyExists && (
              <Link href="/iniciar-sesion" className="font-medium">
                Iniciar sesión
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Field id="email" label="Correo institucional" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={domains[0] ? `usuario@${domains[0]}` : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={pending}
          className="h-10"
        />
      </Field>

      <Field id="password" label="Contraseña" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "password-error" : "password-hint"
          }
          disabled={pending}
          className="h-10"
        />
        {!errors.password && (
          <p id="password-hint" className="text-xs text-muted-foreground">
            Al menos {PASSWORD_MIN_LENGTH} caracteres.
          </p>
        )}
      </Field>

      <Field
        id="confirmPassword"
        label="Repite la contraseña"
        error={errors.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "confirmPassword-error" : undefined
          }
          disabled={pending}
          className="h-10"
        />
      </Field>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
