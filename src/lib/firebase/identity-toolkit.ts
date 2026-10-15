import "server-only";

// Cliente mínimo del REST de Identity Toolkit (Firebase Auth).
// El Admin SDK no puede comprobar una contraseña, por eso el inicio de sesión usa este endpoint.

export type SignInResult =
  | { ok: true; idToken: string; uid: string }
  | { ok: false; code: string };

function baseUrl(): string {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  return emulatorHost
    ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
    : "https://identitytoolkit.googleapis.com/v1";
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  // El emulador acepta cualquier valor como API key
  const apiKey =
    process.env.FIREBASE_API_KEY ||
    (process.env.FIREBASE_AUTH_EMULATOR_HOST ? "emulator" : undefined);
  if (!apiKey) {
    throw new Error("Falta la variable FIREBASE_API_KEY.");
  }

  const response = await fetch(
    `${baseUrl()}/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
    },
  );
  const data = await response.json();

  if (!response.ok) {
    // Ejemplos: "INVALID_LOGIN_CREDENTIALS", "TOO_MANY_ATTEMPTS_TRY_LATER : ..."
    const message: string = data?.error?.message ?? "UNKNOWN";
    return { ok: false, code: message.split(/[\s:]/)[0] };
  }

  return { ok: true, idToken: data.idToken, uid: data.localId };
}
