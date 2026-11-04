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
| `GEMINI_API_KEY` | Clave de la API de Gemini, para generar el curso desde el sílabo (HU06), el resumen (HU10) y el cuestionario (HU11) de una clase. Solo servidor |
| `TRANSCRIPTION_SERVICE_URL` | Dirección del microservicio de transcripción (`recall_isil_api`, en Render) para la HU09. Solo servidor |
| `TRANSCRIPTION_API_KEY` | Clave secreta compartida con el microservicio (la misma que allá se llama `TRANSCRIPTION_API_KEY`; al menos 16 caracteres, mejor 32 bytes aleatorios). Solo servidor |
| `APP_URL` | Opcional. Dirección pública de la app: después de verificar el correo (HU04), Firebase ofrece volver a `{APP_URL}/cursos`. El dominio tiene que estar en «Dominios autorizados» de Firebase Authentication |
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
| `npm test` | Pruebas automáticas (`node --test` sobre `src/**/*.test.ts`) |
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

### Editar y eliminar un curso

- En el detalle del curso, «Editar curso» abre `/cursos/{courseId}/editar`: se cambia el nombre y se agregan, quitan, reordenan o renombran unidades y sesiones. El formulario solo manda títulos y su orden; el servidor valida y **recalcula la numeración** (las unidades 1, 2, 3… y las sesiones de corrido en todo el curso), así que quitar o mover algo nunca deja huecos. La regla de validación está en `src/lib/courses/edit.ts`, con sus pruebas (`npm test`).
- «Eliminar curso» pide confirmación y borra el curso **junto con todas sus clases** (`recursiveDelete`, porque Firestore no borra las subcolecciones solo). No se puede deshacer.
- Las dos acciones llaman a `requireSession()` y comprueban con `getCourse(uid, courseId)` que el curso sea del estudiante; con un curso ajeno responden «No tienes acceso a este curso».

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

### Editar y eliminar una clase

- En la lista de clases, el lápiz abre `/cursos/{courseId}/clases/{classId}/editar` (el mismo formulario del registro, con los datos actuales y las mismas reglas del enlace y del nombre) y el tacho pide confirmación antes de eliminarla.
- Las acciones (`src/app/(private)/cursos/[courseId]/clases/[classId]/actions.ts`) exigen sesión, comprueban que el curso sea del estudiante y que la clase pertenezca a ese curso (`getClass`). Con un curso ajeno responden «No tienes acceso a este curso»; con una clase que no está en el curso, «No encontramos esa clase…».

## Transcripción de la clase (HU09)

En la lista de clases, cada clase tiene el botón «Obtener transcripción». Al pulsarlo, la acción `processClassAction` (`src/app/(private)/cursos/[courseId]/clases/[classId]/actions.ts`) lee el enlace de Zoom **de la clase guardada** (nunca del formulario), pide la transcripción y la guarda en el mismo documento de la clase:

```ts
{
  // ...campos de la HU08
  transcript: "WEBVTT\n\n1\n00:04:55.780 --> ...", // el VTT completo
  transcribedAt: Timestamp, // la pone el servidor
}
```

- El cliente (`src/lib/transcription/client.ts`) llama a `POST {TRANSCRIPTION_SERVICE_URL}/api/transcription/v3` con la cabecera `x-service-key`. El servicio responde la dirección del VTT y la app lo descarga, solo desde `https://isil-pe.zoom.us/rec/play/vtt` (cualquier otra dirección se rechaza).
- Tres resultados: **lista** (se guarda y la clase muestra «Transcripción lista»), **sin subtítulos** («Esta grabación no tiene transcripción disponible», no se guarda nada) y **error** (servicio caído, arranque en frío o más de 2 minutos: se muestra el error y el botón pasa a «Reintentar»; el nombre y el enlace de la clase no se tocan).
- Límite: el VTT que supera ~800 KB no se guarda (Firestore admite 1 MiB por documento). La grabación de prueba pesó ~96 KB.
- La lista de clases no lee el texto de la transcripción (`select` en `listClasses`); solo si existe. Las HU de resumen y cuestionario la leerán de `transcript`.
- El microservicio vive en otro repositorio (`recall_isil_api`): allá la clave se configura como `TRANSCRIPTION_API_KEY` y se acepta en la cabecera `x-service-key`.
- Casos de prueba y resultados: `docs/pruebas/sprint-2-HU09.md`.

## Cuestionario de la clase (HU11)

En la lista de clases, una clase con transcripción muestra «Generar cuestionario»; con el cuestionario ya generado, «Resolver cuestionario». La pantalla es `/cursos/{courseId}/clases/{classId}/cuestionario`. El cuestionario se guarda en el mismo documento de la clase:

```ts
{
  // ...campos de la HU08 y la HU09
  quiz: { questions: [{ question: "...", choices: ["A", "B", "C"], correctIndex: 1 }] }, // exactamente 10
  quizGeneratedAt: Timestamp, // la pone el servidor
}
```

- La acción `generateQuizAction` (`src/app/(private)/cursos/[courseId]/clases/[classId]/cuestionario/actions.ts`) exige sesión, comprueba que el curso y la clase sean del estudiante y lee la transcripción solo en el servidor.
- `generateQuiz` (`src/lib/quiz/generate-quiz.ts`) manda a Gemini el texto de la clase sin tiempos ni nombres de quienes hablan (`vttToPlainText`). Pide 13 preguntas candidatas, cada una con la frase de la clase que la respalda (`evidence`), y hace como máximo 2 intentos de ~55 s cada uno.
- `selectSupportedQuestions` (`src/lib/quiz/select-supported-questions.ts`) es la única puerta: descarta las candidatas cuya frase de respaldo no aparece en la transcripción o que no cumplen el formato, y solo deja pasar 10 preguntas con 3 alternativas distintas y una correcta (`correctIndex` de 0 a 2). Si quedan menos de 10, no se guarda ni se muestra nada: se reintenta una vez y luego se informa el error. `parseQuiz` (`src/lib/quiz/schema.ts`) valida lo ya guardado.
- Resolver y el puntaje corren en el navegador (`scoreQuiz`); los intentos no se guardan (historial = HU14).
- Limitación: el filtro comprueba que la frase citada exista en la clase, no que sostenga la respuesta; no es una garantía de que las preguntas salgan **solo** de la transcripción. Ver `docs/pruebas/sprint-2-HU11.md`.
- Casos de prueba y resultados: `docs/pruebas/sprint-2-HU11.md`.

## Detalle de la clase y grabación original (HU13)

En la lista de clases, el nombre de cada clase lleva a `/cursos/{courseId}/clases/{classId}`. Esa pantalla reúne todo lo de la clase: «Ver grabación», la transcripción (HU09 y HU17), el resumen (HU10) y el cuestionario (HU11).

- «Ver grabación» es un enlace al `zoomUrl` guardado, con `target="_blank"` y `rel="noopener noreferrer"`: se abre en una pestaña nueva y la pestaña de Zoom no puede manipular la de Recall ISIL.

## Carga manual de la transcripción (HU17)

Si «Obtener transcripción» falla o la grabación no tiene subtítulos, la clase muestra «Subir la transcripción manualmente», que lleva a la sección de transcripción del detalle. Ahí se sube un archivo `.vtt` (los subtítulos que se descargan de Zoom) o `.txt`.

- `validateManualTranscript` (`src/lib/transcription/manual.ts`) es la única puerta y corre en el servidor (`uploadTranscriptAction`): solo `.vtt` o `.txt`, no vacío, hasta 800 KB (el mismo límite de la HU09), texto UTF-8 (un PDF o un .docx renombrado se rechaza), un `.vtt` con encabezado `WEBVTT` y líneas de tiempo, y al menos 200 caracteres de texto. El formulario repite las comprobaciones rápidas en el navegador para avisar antes de subir.
- Si el archivo no pasa, se muestra el error y no se toca la clase. Si pasa, se guarda en el mismo campo `transcript` que la HU09, con `transcriptSource: "manual"` (la HU09 ahora guarda `"zoom"`), y se habilitan el resumen y el cuestionario.
- Una clase que ya tiene transcripción no la reemplaza: su resumen y su cuestionario salieron de esa transcripción.
- `transcriptToPlainText` (`src/lib/transcription/text.ts`) entrega a la IA el texto de un VTT (sin tiempos ni nombres) o el de un TXT tal cual.

## Resumen por temas (HU10)

En el detalle de la clase, con transcripción, aparece «Generar resumen». El resumen se guarda en el documento de la clase y, al volver a abrirla, se muestra el guardado sin llamar otra vez a la IA (escenario 3):

```ts
{
  // ...campos de la HU08, HU09 y HU11
  summary: { topics: [{ title: "...", keyIdeas: ["...", "..."], evidence: "frase de la clase" }] }, // 1 a 10 temas
  summaryGeneratedAt: Timestamp, // la pone el servidor
}
```

- `generateSummary` (`src/lib/summary/generate-summary.ts`) sigue el mismo diseño que el cuestionario: salida JSON con esquema, como máximo 2 intentos de ~55 s y la transcripción delimitada para que no pueda colar instrucciones.
- Escenario 2 («no agrega temas que no se dictaron»): cada tema trae la frase de la clase donde se dictó (`evidence`). `selectSupportedTopics` descarta los temas cuya frase no aparece en la transcripción; si se descarta más de la mitad, el intento cuenta como fallido. La frase se muestra debajo de cada tema para que el estudiante pueda comprobarlo.
- Limitación: igual que en la HU11, el filtro comprueba que el **tema** se mencionó en la clase, no que cada idea clave sea fiel a lo dicho.

## Historial de cuestionarios (HU14)

Al terminar un cuestionario («Ver mi puntaje»), el intento se guarda en `users/{uid}/quizAttempts/{attemptId}`:

```ts
{ courseId, classId, className, score, total: 10, answers: [0, 2, ...], createdAt: Timestamp }
```

- `saveQuizAttemptAction` recibe solo las respuestas; el **puntaje lo calcula el servidor** con el cuestionario guardado (`scoreQuiz`), así no se puede enviar un puntaje inventado.
- El navegador genera el id del intento: si se reintenta el guardado, no se duplica. «Resolver de nuevo» genera un id nuevo, así que cada resolución es un intento aparte y los anteriores no se borran (escenario 2).
- «Mi historial» (`/historial`, en el encabezado) agrupa los intentos por curso, con la clase, la fecha y el puntaje (`groupAttemptsByCourse`, `src/lib/quiz/attempts.ts`). Sin intentos, explica cómo empezar.
- Al eliminar un curso o una clase se borran también sus intentos.

## Verificación del correo (HU04)

- Al crear la cuenta, el servidor pide a Firebase Auth que envíe el enlace de verificación (`accounts:sendOobCode`, con el `idToken` del inicio de sesión). Firebase manda el correo con su propia plantilla; abrir el enlace marca la cuenta como verificada.
- «Reenviar enlace» (aviso en las páginas privadas mientras el correo no esté verificado): la sesión es una cookie, no un `idToken`, así que el servidor crea un token personalizado para el uid de la sesión (`createCustomToken`), lo cambia por un `idToken` y pide el envío (`src/lib/auth/verification.ts`).
- Generar un curso (HU06), un resumen (HU10) o un cuestionario (HU11) comprueba `isEmailVerified(uid)` en el servidor **antes** de llamar a la IA. Se consulta Firebase Auth y no la cookie, porque la cookie no se entera de que el estudiante abrió el enlace después de iniciar sesión.
- En los emuladores no se envía ningún correo: el enlace se ve en el registro del emulador de Auth y en `http://127.0.0.1:9099/emulator/v1/projects/demo-recall-isil/oobCodes`. Las cuentas de demostración (`npm run seed:demo`) se crean ya verificadas.
- Las cuentas creadas antes de la HU04 no están verificadas: verán el aviso y tendrán que pulsar «Reenviar enlace».

## Riesgos conocidos

- El mensaje «Este correo ya está registrado» (criterio de HU02) revela que un correo tiene cuenta.
- El registro con el Admin SDK no tiene la protección contra abuso del registro de Firebase.
- Desde la HU04 (Sprint 3) se puede registrar un correo de ISIL ajeno, pero no se puede generar contenido sin abrir el enlace que llega a ese correo.

## Guía de estilos

Los colores, el radio de borde y las tipografías están definidos como tokens en `src/app/globals.css` según la guía de estilos del informe (tema oscuro por defecto, Archivo Black para títulos y Geist para el resto). Para cambiar un color se cambia el token, no el componente.

## Flujo de ramas

`feature/HUxx-descripcion` → PR a `experimental` → PR a `main`. Nada entra a `main` sin un PR aprobado por otro integrante. Los commits llevan la clave de Jira, por ejemplo `feat(HU02): formulario de registro [SCRUM-33]`.
