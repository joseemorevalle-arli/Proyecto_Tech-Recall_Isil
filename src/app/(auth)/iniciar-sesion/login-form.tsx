"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  firstErrors,
  loginSchema,
  type FieldErrors,
  type LoginInput,
} from "@/lib/auth/schemas";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  // El correo es controlado: React 19 reinicia el <form> al terminar la acción y así no se pierde
  const [email, setEmail] = useState("");
  const [clientErrors, setClientErrors] =
    useState<FieldErrors<LoginInput> | null>(null);

  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    if (!result.success) {
      event.preventDefault();
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
            {state.formError}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo institucional</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={pending}
          className="h-10"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          disabled={pending}
          className="h-10"
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
