# Recall ISIL

Asistente de IA para el Rendimiento Efectivo en el Aprendizaje de ISIL. Proyecto tecnológico académico colaborativo (curso Proyecto Tecnológico, ISIL, 2026-2) desarrollado con Scrum.

El estudiante sube el sílabo oficial en PDF, el sistema genera su curso con unidades y sesiones, registra cada clase con el enlace de su grabación de Zoom y, a partir de la transcripción, obtiene un resumen por temas y un cuestionario.

## Stack

- Next.js 15.5 (App Router, Server Actions), React 19 y TypeScript 5
- Tailwind CSS 4 y shadcn/ui
- Firebase Authentication y Cloud Firestore (`firebase-admin` en el servidor)
- Despliegue: pendiente. En el Sprint 1 la aplicación se ejecuta en local con los emuladores de Firebase

> Se usa Next.js 15.5 y no 15.3 porque la rama 15.3 ya no recibe parches de seguridad (su último parche, 15.3.9, tiene vulnerabilidades críticas conocidas).

## Requisitos

- Node.js 22 o superior y npm
- Java 21 o superior, solo para el emulador de Firestore (en Windows: `winget install Microsoft.OpenJDK.21`)

## Demostración local (Sprint 1)

En el Sprint 1 la aplicación se presenta en local, sin servicios en la nube: los **emuladores de Firebase** hacen de Authentication y de base de datos (Firestore) dentro de tu computadora. Para no depender de registrar cuentas en vivo, hay **cuentas de demostración**: correos institucionales con una contraseña genérica.

1. Trae lo último de `main` e instala: `git pull` y `npm install`.
2. Copia `.env.example` como `.env.local` (en Windows: `copy .env.example .env.local`) y completa:

   ```
   ALLOWED_EMAIL_DOMAINS=mail.isil.pe
   DEMO_ACCOUNTS=nombre.apellido@mail.isil.pe,otro.alumno@mail.isil.pe
   DEMO_PASSWORD=una contraseña de al menos 8 caracteres
   ```

3. Ejecuta `npm run demo`. Enciende los emuladores, crea las cuentas de demostración y levanta la aplicación. La primera vez descarga los emuladores (necesita internet).
4. Abre http://localhost:3000 e inicia sesión con un correo de `DEMO_ACCOUNTS` y la contraseña `DEMO_PASSWORD`. También puedes crear una cuenta nueva en «Crear cuenta».
5. Las cuentas y sus documentos se ven en la interfaz de los emuladores: http://127.0.0.1:4000 (Authentication y Firestore).

Para detener todo, pulsa `Ctrl + C`. Los datos se borran al detenerlo y las cuentas de demostración se vuelven a crear en el siguiente `npm run demo`.

La contraseña genérica es solo para esta demostración: `scripts/seed-demo.mjs` se niega a crear cuentas si no detecta los emuladores. Cuando se conecte el proyecto real de Firebase, cada estudiante entrará con su propia cuenta.

**Alternativa en dos terminales:** `npm run emulators` en una y `npm run dev` en otra. En ese caso, `.env.local` necesita también `FIREBASE_PROJECT_ID=demo-recall-isil`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` y `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, y las cuentas de demostración se crean con `npm run seed:demo`.

## Variables de entorno

Están descritas en `.env.example`, con el origen de cada una.

| Variable | Uso |
|---|---|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Cuenta de servicio del Admin SDK (servidor) |
| `FIREBASE_API_KEY` | Clave web para el REST de inicio de sesión. Solo servidor, sin `NEXT_PUBLIC_` |
| `ALLOWED_EMAIL_DOMAINS` | Dominios de correo permitidos para registrarse, separados por comas |
| `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` | Solo en local, para usar los emuladores (`npm run demo` las pone solo) |
| `DEMO_ACCOUNTS`, `DEMO_PASSWORD` | Solo para la demostración local: correos institucionales y su contraseña genérica |

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas automáticas (por ahora, el validador de sílabos) |
| `npm run emulators` | Emuladores de Firebase Auth (9099) y Firestore (8080) |
| `npm run demo` | Emuladores + cuentas de demostración + servidor de desarrollo, en un solo comando |
| `npm run seed:demo` | Crea las cuentas de demostración (los emuladores deben estar encendidos) |
| `npm run seed:cursos -- <correo>` | Crea cursos de prueba en los emuladores para esa cuenta |

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

## Cursos (HU07)

Cada curso es un documento en `users/{uid}/courses/{courseId}` con sus unidades y sesiones dentro (la forma está en `src/lib/courses/schema.ts`). La HU06 lo escribe y la HU07 lo lee:

```ts
{
  name: "Nombre del curso",
  units: [
    { number: 1, title: "Unidad 1", sessions: [{ number: 1, title: "Sesión 1" }] },
  ],
}
```

- `/cursos` lista los cursos del estudiante (`listCourses(uid)`) y `/cursos/{courseId}` muestra uno (`getCourse(uid, courseId)`). Ambas funciones están en `src/lib/courses/queries.ts` y solo buscan dentro de `users/{uid}`; por eso el curso de otro estudiante muestra «No tienes acceso a este curso».
- El botón «Subir sílabo» lleva a la ruta de la HU05, definida en `UPLOAD_SYLLABUS_PATH` (`src/app/(private)/cursos/utils.ts`).
- Para probar en local sin la HU06: con los emuladores corriendo y la cuenta ya creada, `npm run seed:cursos -- correo@mail.isil.pe` crea dos cursos de prueba. El script siempre apunta a los emuladores.

## Clases (HU08)

Cada clase es un documento en `users/{uid}/courses/{courseId}/classes/{classId}`:

```ts
{
  name: "Sesión 3: Modelo entidad-relación",
  zoomUrl: "https://isil-pe.zoom.us/rec/play/...",
  createdAt: Timestamp, // la pone el servidor (FieldValue.serverTimestamp())
}
```

- En el detalle del curso, el botón «Registrar clase» abre `/cursos/{courseId}/clases/nueva`. El formulario valida el enlace mientras el estudiante escribe y solo habilita el envío cuando hay un nombre y un enlace válido.
- La regla del enlace está en un solo lugar, `classSchema` (`src/lib/classes/schema.ts`): acepta `https://isil-pe.zoom.us/rec/play/` seguido del código de la grabación y, si los hay, parámetros (`?...`). La usan el formulario y la Server Action, que vuelve a validar antes de guardar.
- La Server Action (`src/app/(private)/cursos/[courseId]/clases/nueva/actions.ts`) llama a `requireSession()`, comprueba con `getCourse(uid, courseId)` que el curso sea del estudiante (si no, responde «No tienes acceso a este curso»), guarda la clase y vuelve al curso con el aviso «Clase registrada».
- `listClasses(uid, courseId)` (`src/lib/classes/queries.ts`) devuelve las clases de la más reciente a la más antigua; el detalle del curso las muestra en «Clases registradas».

## Riesgos conocidos (Sprint 1)

- El mensaje «Este correo ya está registrado» (criterio de HU02) revela que un correo tiene cuenta.
- El registro con el Admin SDK no tiene la protección contra abuso del registro de Firebase.
- Sin verificación de correo (HU04, Sprint 3) se puede registrar un correo de ISIL ajeno.

## Guía de estilos

Los colores, el radio de borde y las tipografías están definidos como tokens en `src/app/globals.css` según la guía de estilos del informe (tema oscuro por defecto, Archivo Black para títulos y Geist para el resto). Para cambiar un color se cambia el token, no el componente.

## Flujo de ramas

`feature/HUxx-descripcion` → PR a `experimental` → PR a `main`. Nada entra a `main` sin un PR aprobado por otro integrante. Los commits llevan la clave de Jira, por ejemplo `feat(HU02): formulario de registro [SCRUM-33]`.
