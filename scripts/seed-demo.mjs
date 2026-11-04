// Crea las cuentas de demostración en los emuladores de Firebase (solo para presentar en local).
// Cada correo de DEMO_ACCOUNTS queda con la contraseña genérica DEMO_PASSWORD.
// Lo ejecuta `npm run demo`; también se puede correr solo con `npm run seed:demo` si los emuladores ya están encendidos.
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Lee .env.local sin pisar las variables que ya existen (por ejemplo, las que pone `firebase emulators:exec`)
try {
  process.loadEnvFile(".env.local");
} catch {
  // sin .env.local se usan solo las variables del entorno
}

const env = process.env;

// Seguridad: la contraseña genérica nunca debe usarse en un proyecto real de Firebase
if (!env.FIREBASE_AUTH_EMULATOR_HOST || !env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "seed:demo solo funciona con los emuladores de Firebase. Usa `npm run demo`.",
  );
  process.exit(1);
}

const accounts = splitList(env.DEMO_ACCOUNTS);
if (accounts.length === 0) {
  console.warn(
    "No hay cuentas de demostración: agrega DEMO_ACCOUNTS en .env.local (correos separados por comas).",
  );
  process.exit(0);
}

const password = env.DEMO_PASSWORD ?? "";
if (password.length < 8) {
  console.error("DEMO_PASSWORD debe tener al menos 8 caracteres (en .env.local).");
  process.exit(1);
}

// Misma regla de dominio que src/lib/auth/email-domain.ts
const domains = splitList(env.ALLOWED_EMAIL_DOMAINS).map((d) => d.replace(/^@/, ""));

const app = initializeApp({
  projectId: env.FIREBASE_PROJECT_ID || "demo-recall-isil",
});
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Cuentas de demostración:");
for (const email of accounts) {
  if (!domains.includes(email.split("@").pop())) {
    console.warn(`  - ${email}: omitida, su dominio no está en ALLOWED_EMAIL_DOMAINS`);
    continue;
  }

  // Si la cuenta ya existe, se le vuelve a poner la contraseña genérica
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, emailVerified: true });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    // HU04: las cuentas de demostración ya vienen con el correo verificado
    user = await auth.createUser({ email, password, emailVerified: true });
  }

  // Mismo documento que crea el registro (HU02)
  const userDoc = db.doc(`users/${user.uid}`);
  if (!(await userDoc.get()).exists) {
    await userDoc.create({ email, createdAt: FieldValue.serverTimestamp() });
  }
  console.log(`  ✓ ${email}`);
}

await deleteApp(app);

function splitList(value) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
