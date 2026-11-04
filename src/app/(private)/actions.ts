"use server";

import { redirect } from "next/navigation";
import { destroySession, requireSession } from "@/lib/auth/session";
import { isEmailVerified, resendVerificationLink, VERIFICATION_MESSAGES } from "@/lib/auth/verification";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/iniciar-sesion");
}

export type ResendLinkState = { status?: "sent" | "error"; message?: string };

// HU04, escenario 3: «Reenviar enlace». El correo sale de Firebase Auth, al correo de la cuenta de la sesión.
export async function resendVerificationAction(): Promise<ResendLinkState> {
  const { uid, email } = await requireSession();

  try {
    if (await isEmailVerified(uid)) return { status: "error", message: VERIFICATION_MESSAGES.alreadyVerified };

    const result = await resendVerificationLink(uid);
    if (!result.ok) return { status: "error", message: result.message };
  } catch (error) {
    console.error("Error al reenviar el enlace de verificación:", error instanceof Error ? error.name : "desconocido");
    return { status: "error", message: VERIFICATION_MESSAGES.sendFailed };
  }

  return { status: "sent", message: `Te enviamos un nuevo enlace a ${email}. Revisa también la carpeta de spam.` };
}
