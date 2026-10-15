import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

// Nombre de la cookie de sesión. El middleware lo repite porque no puede importar este archivo.
export const SESSION_COOKIE = "session";

// Duración de la sesión: 5 días
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

// Cambia el idToken de Firebase (dura 1 hora) por una cookie de sesión de 5 días y la guarda en el navegador
export async function createSession(idToken: string): Promise<void> {
  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true, // JavaScript del navegador no puede leerla
    secure: process.env.NODE_ENV === "production", // solo por HTTPS en producción
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}
