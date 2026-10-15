import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Proyecto ficticio para los emuladores (el prefijo demo- evita tocar un proyecto real)
export const EMULATOR_PROJECT_ID = "demo-recall-isil";

export function usingEmulators(): boolean {
  return Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIRESTORE_EMULATOR_HOST,
  );
}

// Inicialización perezosa: se crea la app recién cuando se usa, así el build no falla si faltan variables
function getAdminApp(): App {
  if (getApps().length > 0) return getApp();

  if (usingEmulators()) {
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || EMULATOR_PROJECT_ID,
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En .env y en Vercel la clave va en una sola línea con los saltos escapados (\n)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan variables de Firebase: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
