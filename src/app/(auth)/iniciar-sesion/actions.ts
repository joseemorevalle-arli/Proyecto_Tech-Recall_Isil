"use server";

import { redirect } from "next/navigation";
import {
  firstErrors,
  loginSchema,
  MESSAGES,
  type FieldErrors,
  type LoginInput,
} from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";
import { signInWithPassword } from "@/lib/firebase/identity-toolkit";

export type LoginState = {
  email: string;
  fieldErrors?: FieldErrors<LoginInput>;
  formError?: string;
};

// Errores de Firebase que se muestran igual, para no revelar si el correo existe
const INVALID_CREDENTIAL_CODES = [
  "INVALID_LOGIN_CREDENTIALS",
  "EMAIL_NOT_FOUND",
  "INVALID_PASSWORD",
  "USER_DISABLED",
];

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");

  // 1. Validar el formato
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { email: rawEmail, fieldErrors: firstErrors(parsed.error) };
  }
  const { email, password } = parsed.data;

  // 2. Comprobar correo y contraseña con Firebase y crear la cookie de sesión
  try {
    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      if (INVALID_CREDENTIAL_CODES.includes(result.code)) {
        return { email, formError: MESSAGES.invalidCredentials };
      }
      if (result.code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        return {
          email,
          formError:
            "Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
        };
      }
      console.error("Error de Firebase al iniciar sesión:", result.code);
      return { email, formError: "No pudimos iniciar tu sesión. Inténtalo de nuevo." };
    }
    await createSession(result.idToken);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return { email, formError: "No pudimos iniciar tu sesión. Inténtalo de nuevo." };
  }

  // redirect() va fuera del try/catch porque funciona lanzando una excepción
  redirect("/cursos");
}
