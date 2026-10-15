import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

// Nombre de la cookie de sesión. El middleware lo repite porque no puede importar este archivo.
export const SESSION_COOKIE = "session";

// Duración de la sesión: 5 días
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type Session = { uid: string; email: string };

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

// Devuelve la sesión si la cookie es válida, o null.
// cache() hace que se verifique una sola vez por petición aunque la llamen el layout y la página.
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    // true = también revisa que la sesión no haya sido revocada (cierre de sesión)
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return null; // vencida, revocada o alterada
  }
});

// Para páginas privadas y Server Actions: devuelve la sesión o envía a iniciar sesión.
// Las demás HU leen el uid de aquí para filtrar sus datos en users/{uid}.
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/iniciar-sesion");
  return session;
}

// Cierra la sesión: revoca los tokens del usuario (la cookie deja de servir aunque alguien la haya copiado)
// y borra la cookie del navegador
export async function destroySession(): Promise<void> {
  const session = await getSession();
  if (session) {
    await adminAuth()
      .revokeRefreshTokens(session.uid)
      .catch((error) => console.error("No se pudo revocar la sesión:", error));
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
