import "server-only";
import { adminAuth } from "@/lib/firebase/admin";
import { sendVerificationEmail, signInWithCustomToken } from "@/lib/firebase/identity-toolkit";

// HU04: mensajes que ve el estudiante
export const VERIFICATION_MESSAGES = {
  // Escenario 2: se muestra en lugar de generar el curso, el resumen o el cuestionario
  required:
    "Verifica tu correo para generar contenido. Abre el enlace que te enviamos o pulsa «Reenviar enlace» en el aviso de arriba.",
  sendFailed: "No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.",
  tooMany: "Ya te enviamos varios enlaces. Espera unos minutos antes de pedir otro.",
  alreadyVerified: "Tu correo ya está verificado. Recarga la página.",
} as const;

// Adónde vuelve el estudiante después de verificar (opcional). El dominio tiene que estar autorizado en Firebase.
function continueUrl(): string | undefined {
  const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");
  return appUrl ? `${appUrl}/cursos?correo-verificado=1` : undefined;
}

// Se consulta a Firebase Auth y no a la cookie: la cookie guarda el estado del momento en que se inició
// sesión y no se entera de que el estudiante abrió el enlace después.
export async function isEmailVerified(uid: string): Promise<boolean> {
  const user = await adminAuth().getUser(uid);
  return user.emailVerified;
}

export type SendLinkResult = { ok: true } | { ok: false; message: string };

function toResult(result: { ok: true } | { ok: false; code: string }): SendLinkResult {
  if (result.ok) return { ok: true };
  if (result.code === "TOO_MANY_ATTEMPTS_TRY_LATER") return { ok: false, message: VERIFICATION_MESSAGES.tooMany };
  console.error("Firebase no envió el enlace de verificación:", result.code);
  return { ok: false, message: VERIFICATION_MESSAGES.sendFailed };
}

// Al crear la cuenta (escenario 1) ya se tiene el idToken del inicio de sesión
export async function sendVerificationLinkWithIdToken(idToken: string): Promise<SendLinkResult> {
  return toResult(await sendVerificationEmail(idToken, continueUrl()));
}

// «Reenviar enlace» (escenario 3). La sesión es una cookie, no un idToken: el servidor crea un token
// personalizado para el uid de la sesión y lo cambia por un idToken solo para pedir el envío.
export async function resendVerificationLink(uid: string): Promise<SendLinkResult> {
  const customToken = await adminAuth().createCustomToken(uid);
  const signIn = await signInWithCustomToken(customToken);
  if (!signIn.ok) return toResult(signIn);
  return toResult(await sendVerificationEmail(signIn.idToken, continueUrl()));
}
