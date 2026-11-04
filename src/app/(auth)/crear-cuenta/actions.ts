"use server";

import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { getAllowedEmailDomains } from "@/lib/auth/allowed-domains";
import {
  buildRegisterSchema,
  firstErrors,
  MESSAGES,
  type FieldErrors,
  type RegisterInput,
} from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";
import { sendVerificationLinkWithIdToken } from "@/lib/auth/verification";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { signInWithPassword } from "@/lib/firebase/identity-toolkit";

export type RegisterState = {
  email: string;
  fieldErrors?: FieldErrors<RegisterInput>;
  formError?: string;
  emailAlreadyExists?: boolean;
};

const GENERIC_ERROR =
  "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.";

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const rawEmail = String(formData.get("email") ?? "");

  // 1. Validar en el servidor (el formulario ya validó, pero no confiamos en el navegador)
  const parsed = buildRegisterSchema(getAllowedEmailDomains()).safeParse({
    email: rawEmail,
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return { email: rawEmail, fieldErrors: firstErrors(parsed.error) };
  }
  const { email, password } = parsed.data;

  // 2. Crear el usuario en Firebase Authentication
  let uid: string;
  try {
    const user = await adminAuth().createUser({ email, password });
    uid = user.uid;
  } catch (error) {
    if (getErrorCode(error) === "auth/email-already-exists") {
      return {
        email,
        emailAlreadyExists: true,
        formError: MESSAGES.emailAlreadyExists,
      };
    }
    console.error("Error al crear el usuario:", error);
    return { email, formError: GENERIC_ERROR };
  }

  // 3. Crear su documento en Firestore; si falla, se borra el usuario para que pueda reintentar
  try {
    await adminDb()
      .doc(`users/${uid}`)
      .create({ email, createdAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("Error al crear users/{uid}:", error);
    await adminAuth()
      .deleteUser(uid)
      .catch((deleteError) =>
        console.error("No se pudo borrar el usuario incompleto:", deleteError),
      );
    return { email, formError: GENERIC_ERROR };
  }

  // 4. Iniciar la sesión. La cuenta ya existe: si esto falla, lo enviamos a iniciar sesión.
  let sessionStarted = false;
  try {
    const signIn = await signInWithPassword(email, password);
    if (signIn.ok) {
      await createSession(signIn.idToken);
      sessionStarted = true;

      // HU04, escenario 1: Firebase envía el enlace de verificación. Si falla, la cuenta igual queda
      // creada: el estudiante puede pedirlo con «Reenviar enlace».
      const sent = await sendVerificationLinkWithIdToken(signIn.idToken).catch(() => ({ ok: false }) as const);
      if (!sent.ok) console.error("No se pudo enviar el enlace de verificación tras el registro.");
    }
  } catch (error) {
    console.error("Error al iniciar la sesión tras el registro:", error);
  }

  // redirect() se llama fuera del try/catch porque funciona lanzando una excepción
  redirect(sessionStarted ? "/cursos" : "/iniciar-sesion");
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}
