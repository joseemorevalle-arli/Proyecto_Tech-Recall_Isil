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

function apiKey(): string {
  // El emulador acepta cualquier valor como API key
  const key =
    process.env.FIREBASE_API_KEY ||
    (process.env.FIREBASE_AUTH_EMULATOR_HOST ? "emulator" : undefined);
  if (!key) {
    throw new Error("Falta la variable FIREBASE_API_KEY.");
  }
  return key;
}

type CallResult = { ok: true; data: Record<string, unknown> } | { ok: false; code: string };

// POST a un método de Identity Toolkit. Los errores llegan como código, por ejemplo
// "INVALID_LOGIN_CREDENTIALS" o "TOO_MANY_ATTEMPTS_TRY_LATER : ..." (se toma solo la primera palabra).
async function call(method: string, body: Record<string, unknown>): Promise<CallResult> {
  const response = await fetch(`${baseUrl()}/${method}?key=${encodeURIComponent(apiKey())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message: string = data?.error?.message ?? "UNKNOWN";
    return { ok: false, code: message.split(/[\s:]/)[0] };
  }
  return { ok: true, data };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const result = await call("accounts:signInWithPassword", { email, password, returnSecureToken: true });
  if (!result.ok) return result;
  return { ok: true, idToken: String(result.data.idToken), uid: String(result.data.localId) };
}

// HU04: cambia un token personalizado (creado con el Admin SDK) por un idToken del usuario.
// Hace falta para reenviar el enlace de verificación, porque la sesión guarda una cookie y no un idToken.
export async function signInWithCustomToken(token: string): Promise<SignInResult> {
  const result = await call("accounts:signInWithCustomToken", { token, returnSecureToken: true });
  if (!result.ok) return result;
  return { ok: true, idToken: String(result.data.idToken), uid: String(result.data.localId ?? "") };
}

export type SendOobResult = { ok: true } | { ok: false; code: string };

// HU04: Firebase envía al correo del usuario el enlace de verificación (con su plantilla de correo).
// En los emuladores no se envía nada: el enlace aparece en el registro del emulador de Auth.
export async function sendVerificationEmail(idToken: string, continueUrl?: string): Promise<SendOobResult> {
  const result = await call("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
    ...(continueUrl ? { continueUrl } : {}),
  });
  return result.ok ? { ok: true } : result;
}
