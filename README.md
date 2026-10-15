# Recall ISIL

Asistente de IA para el Rendimiento Efectivo en el Aprendizaje de ISIL. Proyecto tecnológico académico colaborativo (curso Proyecto Tecnológico, ISIL, 2026-2) desarrollado con Scrum.

El estudiante sube el sílabo oficial en PDF, el sistema genera su curso con unidades y sesiones, registra cada clase con el enlace de su grabación de Zoom y, a partir de la transcripción, obtiene un resumen por temas y un cuestionario.

## Stack

- Next.js 15.5 (App Router, Server Actions), React 19 y TypeScript 5
- Tailwind CSS 4 y shadcn/ui
- Firebase Authentication y Cloud Firestore (`firebase-admin` en el servidor)
- Despliegue en Vercel: `experimental` = staging (preview), `main` = producción

> Se usa Next.js 15.5 y no 15.3 porque la rama 15.3 ya no recibe parches de seguridad (su último parche, 15.3.9, tiene vulnerabilidades críticas conocidas).

## Requisitos

- Node.js 22 o superior y npm
- Java 21 o superior, solo para el emulador de Firestore (en Windows: `winget install Microsoft.OpenJDK.21`)

## Cómo levantar el proyecto en local (con emuladores)

No necesitas un proyecto de Firebase: los emuladores simulan Authentication y Firestore en tu computadora.

1. Instala las dependencias: `npm install`
2. Crea `.env.local` en la raíz con este contenido (no tiene secretos):

   ```
   FIREBASE_PROJECT_ID=demo-recall-isil
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
   ALLOWED_EMAIL_DOMAINS=mail.isil.pe
   ```

3. En una terminal: `npm run emulators` (la interfaz de los emuladores queda en http://127.0.0.1:4000).
4. En otra terminal: `npm run dev` y abre http://localhost:3000.

Los datos de los emuladores se borran al detenerlos.

## Variables de entorno

Están descritas en `.env.example`, con el origen de cada una.

| Variable | Uso |
|---|---|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Cuenta de servicio del Admin SDK (servidor) |
| `FIREBASE_API_KEY` | Clave web para el REST de inicio de sesión. Solo servidor, sin `NEXT_PUBLIC_` |
| `ALLOWED_EMAIL_DOMAINS` | Dominios de correo permitidos para registrarse, separados por comas |
| `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` | Solo en local, para usar los emuladores |

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm run emulators` | Emuladores de Firebase Auth (9099) y Firestore (8080) |

## Cómo funciona la sesión

Todo ocurre en el servidor; el navegador nunca habla directamente con Firebase.

1. **Registro** (`/crear-cuenta`): una Server Action valida los datos con zod (también el dominio), crea el usuario con el Admin SDK, crea su documento `users/{uid}` en Firestore e inicia la sesión.
2. **Inicio de sesión** (`/iniciar-sesion`): una Server Action comprueba el correo y la contraseña con el REST de Firebase Auth, recibe un token y lo cambia por una **cookie de sesión** de 5 días (`httpOnly`, el JavaScript del navegador no puede leerla).
3. **Páginas privadas**: `src/middleware.ts` solo revisa que la cookie exista. La verificación real la hace `requireSession()` (`src/lib/auth/session.ts`), que comprueba la firma de la cookie y que no haya sido revocada.
4. **Cierre de sesión**: borra la cookie y revoca la sesión en Firebase, así una copia de la cookie deja de servir.

### Cómo usarlo en una HU nueva

- En cada página privada y en cada Server Action, llama primero a `requireSession()`. Devuelve `{ uid, email }` o envía a iniciar sesión.
- Guarda y lee los datos del estudiante dentro de `users/{uid}` usando `adminDb()` (`src/lib/firebase/admin.ts`) y el `uid` de la sesión. Nunca uses un uid que venga del formulario.
- Si creas una ruta privada nueva, agrégala al `matcher` de `src/middleware.ts`.

```ts
const { uid } = await requireSession();
const courses = await adminDb().collection(`users/${uid}/courses`).get();
```

## Riesgos conocidos (Sprint 1)

- El mensaje «Este correo ya está registrado» (criterio de HU02) revela que un correo tiene cuenta.
- El registro con el Admin SDK no tiene la protección contra abuso del registro de Firebase.
- Sin verificación de correo (HU04, Sprint 3) se puede registrar un correo de ISIL ajeno.

## Guía de estilos

Los colores, el radio de borde y las tipografías están definidos como tokens en `src/app/globals.css` según la guía de estilos del informe (tema oscuro por defecto, Archivo Black para títulos y Geist para el resto). Para cambiar un color se cambia el token, no el componente.

## Flujo de ramas

`feature/HUxx-descripcion` → PR a `experimental` → PR a `main`. Nada entra a `main` sin un PR aprobado por otro integrante. Los commits llevan la clave de Jira, por ejemplo `feat(HU02): formulario de registro [SCRUM-33]`.
