# Recall ISIL: contexto para Claude Code

Lee este archivo completo antes de trabajar. Si algo de aquí choca con lo que José te pida en el chat, pregúntale antes de seguir.

## Qué es el proyecto

- **Recall ISIL** ("Asistente de IA para el Rendimiento Efectivo en el Aprendizaje de ISIL") es una aplicación web para estudiantes de ISIL, sobre todo los que trabajan y estudian.
- Flujo del MVP: el estudiante sube el sílabo oficial en PDF → el sistema genera el curso con sus unidades y sesiones → registra cada clase con el enlace de su grabación de Zoom (`https://isil-pe.zoom.us/rec/play/...`) → el sistema obtiene la transcripción (VTT) → Gemini genera un resumen por temas y un cuestionario de 10 preguntas (3 alternativas, 1 correcta).
- Es el proyecto del curso Proyecto Tecnológico de ISIL (NRC 3709.202620, periodo 2026-2). Docente: Marco Aurelio Espinoza Rivera.

## Equipo (Grupo 1) y roles Scrum

| Integrante | Rol |
|---|---|
| Chunga Achong, Eky | Scrum Master |
| León Flores, Carlos Israel | Developer (QA y despliegue) |
| More Valle, José del Carmen | Developer (backend e IA). Es quien trabaja contigo |
| Palomino Fernández, Jerimi Scott | Developer (frontend y UX/UI) |
| Talavera Artunduaga, Fabrizio Alejandro | Product Owner |

En el Sprint 1 cada integrante desarrolla 2 HU completas (front y back). **José desarrolla HU02 y HU03.** No toques el código de las HU de otros integrantes salvo que José lo pida.

## Stack (no lo cambies sin consultar)

- Next.js 15.3 con App Router, React 19 y TypeScript 5. Carpeta `src/` y alias `@/*`.
- Tailwind CSS 4 + shadcn/ui.
- Route Handlers y Server Actions.
- Firebase Authentication (correo y contraseña) + Cloud Firestore, con `firebase-admin` en el servidor.
- Gemini API (modelo Flash, salida JSON con esquema): HU06 en el Sprint 1 y el resto desde el Sprint 2.
- `pdf2json` para leer los sílabos (HU05).
- Microservicio Node.js + Puppeteer en Render para obtener la transcripción (HU09, Sprint 2). Su URL se lee de una variable de entorno.
- Vercel: preview = staging (rama `experimental`), `main` = producción.
- ESLint 9, GitHub (repositorio `recall-isil`), Jira (proyecto SCRUM) y Figma (prototipos y guía de estilos).
- José trabaja en Windows. Usa comandos que funcionen ahí.

## Convenciones

- Ramas: `feature/HUxx-descripcion` → PR a `experimental` → PR a `main`. Nada entra a `main` sin un PR aprobado por otro integrante.
- Commits pequeños, en español y con la clave de Jira de la subtarea. Ejemplo: `feat(HU02): formulario de registro [SCRUM-33]`.
- Textos de la interfaz en español. Los mensajes que aparecen en los criterios de aceptación van **exactamente** como están escritos, con las comillas «».
- Identificadores de código en inglés y comentarios en español, breves. Rutas visibles en español (`/crear-cuenta`, `/iniciar-sesion`, `/cursos`).
- Los secretos van solo en `.env.local` y en las variables de entorno de Vercel, nunca en el código ni en un commit. Mantén `.env.example` al día y sin valores reales.
- La carpeta `contexto/` (informe y material del curso) **no se sube a GitHub** y debe estar en `.gitignore`.
- Antes de dar algo por terminado, `npm run lint` y `npm run build` deben pasar sin errores.
- No hagas `git push`, merges ni cambios en servicios externos (Firebase, Vercel, GitHub) sin que José lo confirme.

## Definition of Done (se aplica a cada HU)

1. Cumple sus escenarios de aceptación.
2. Tiene un PR aprobado por otro integrante.
3. `npm run build` y el lint terminan sin errores.
4. Tiene pruebas funcionales registradas (las ejecuta y registra Carlos, como QA).
5. El PO la validó en staging.
6. Respeta la guía de estilos, es responsive y tiene estados de carga, error y vacío.
7. No tiene credenciales en el código.
8. Está integrada en `main`, desplegada y en la columna «Finalizado» de Jira.

## Sprint 1 (activo)

- Objetivo: "El estudiante crea su cuenta, genera su curso desde el sílabo oficial y registra sus clases con el enlace de Zoom validado."
- En Jira va del 14/10/2026 a las 22:33 al 15/10/2026 a las 23:59, hora de Lima. La Sprint Review es el jueves 15/10, con demo en vivo **desde el entorno desplegado**, no desde local.
- Historias (clave de Jira · valor de negocio · story points): HU02 SCRUM-12 · 54 · 3 | HU03 SCRUM-13 · 70 · 2 | HU05 SCRUM-14 · 68 · 5 | HU06 SCRUM-15 · 78 · 8 | HU07 SCRUM-16 · 64 · 3 | HU08 SCRUM-17 · 90 · 3. Total: 24 SP.
- Tarea habilitadora SCRUM-28 (entorno base): SCRUM-29 proyecto Next.js, SCRUM-30 Firebase, SCRUM-31 Vercel (Carlos) y SCRUM-32 ESLint y verificación en cada PR (Carlos).
- Subtareas de José: HU02 → SCRUM-33 (front) y SCRUM-34 (back). HU03 → SCRUM-37 (front) y SCRUM-38 (back).
- Pruebas de Carlos: SCRUM-35 (HU02) y SCRUM-39 (HU03). Validación del PO: SCRUM-36 y SCRUM-40.
- La bitácora del Daily se lleva como comentarios en SCRUM-59.
- Columnas del tablero: Por hacer → En curso → En revisión → Finalizado.

## Resto del backlog (referencia)

- Sprint 2: HU09 obtención automática de la transcripción (13 SP) y HU11 cuestionario de 10 preguntas (8).
- Sprint 3: HU10 resumen por temas (8), HU17 carga manual de la transcripción (3), HU04 verificación del correo (3), HU14 historial de cuestionarios (5) y HU13 acceso a la grabación original (1).
- Sprint 4: HU12 detección de clase duplicada (3), HU01 página de inicio (3) y HU15 restablecer contraseña (2).
- Épicas por refinar, todavía sin HU: E6 planes de suscripción y E7 convenio institucional ISIL.

## Decisiones técnicas

Anota aquí, en una línea cada una, las decisiones que José confirme (por ejemplo, cómo se maneja la sesión), para que las próximas sesiones y el resto del equipo las sigan.

- (15/10/2026) Next.js 15.5.28 en lugar de 15.3: la rama 15.3 ya no recibe parches y su último parche (15.3.9) tiene 2 vulnerabilidades críticas (RCE). Se fija la versión exacta.
- (15/10/2026) Autenticación 100 % en el servidor: el navegador no usa el SDK cliente de Firebase; `FIREBASE_API_KEY` va sin `NEXT_PUBLIC_`. Registro con `createUser` del Admin SDK + `users/{uid}`; inicio de sesión con el REST `accounts:signInWithPassword` + `createSessionCookie` (5 días, `httpOnly`, `secure` en producción, `sameSite: 'lax'`).
- (15/10/2026) `middleware.ts` solo revisa que exista la cookie (sin `firebase-admin`). La verificación real es `requireSession()` (`verifySessionCookie(cookie, true)`, con React `cache`), que llaman el layout privado, **cada página privada y cada Server Action**, porque el layout no se vuelve a ejecutar al navegar entre páginas.
- (15/10/2026) Las demás HU leen y escriben datos en el servidor, filtrando por el `uid` que devuelve `requireSession()`, dentro de `users/{uid}`.
- (15/10/2026) Cerrar sesión borra la cookie y llama a `revokeRefreshTokens(uid)`: la cookie deja de servir aunque alguien la haya copiado (cierra la sesión en todos los dispositivos).
- (15/10/2026) Riesgos aceptados para el Sprint 1: el mensaje «Este correo ya está registrado» (criterio de HU02) revela que un correo existe; `createUser` del Admin SDK no tiene la protección contra abuso del registro de Firebase; sin verificación de correo (HU04, Sprint 3) se puede registrar un correo de ISIL ajeno.
- (15/10/2026) Guía de estilos: tema oscuro por defecto (`class="dark"` en `<html>`), paleta de la Tabla 8 del informe en `globals.css`, Archivo Black para títulos (`font-heading`) y Geist para el resto. En la Tabla 8 del PDF las filas están desalineadas; se interpretó destructive = #FF6467 y gradiente de marca = #1E3A8A → #38BDF8.
- (15/10/2026) Por ahora el desarrollo corre en local con los emuladores de Firebase (proyecto ficticio demo-recall-isil, Java 21); el proyecto real de Firebase y el despliegue se configuran después. El repositorio en GitHub es joseemorevalle-arli/Proyecto_Tech-Recall_Isil.
- (15/10/2026) El Sprint 1 se presenta en local (decisión del equipo, reemplaza lo de la demo desde el entorno desplegado): sin Vercel ni proyecto real de Firebase. `npm run demo` levanta los emuladores, crea las cuentas de demostración (correos institucionales de `DEMO_ACCOUNTS` con la contraseña genérica `DEMO_PASSWORD`, solo en emuladores) y la app. Flujo: push → PR → merge en GitHub → pull y ejecución local. Después se conectará el proyecto real de Firebase y se desplegará en Firebase (App Hosting exige el plan Blaze).
- (15/10/2026) Integración del Sprint 1: la HU06 guarda el curso en `users/{uid}/courses` con `requireSession()` y el esquema de `src/lib/courses/schema.ts` (el que lee la HU07); el botón «Subir sílabo» lleva a `/cargar-silabo` (HU05). Pendiente para Eky: HU05 todavía guarda en la colección global `silabos` sin sesión, y `cargar-silabo/actions.ts` fija `FIRESTORE_EMULATOR_HOST` en el código (hay que quitarlo antes de usar el Firebase real).

## Reglas académicas (importantes)

- Los artefactos del curso tienen que ser **reales**. Nunca inventes resultados de pruebas, dailies, fechas, métricas, capturas ni datos de usuarios. Si falta un dato, pregúntalo o déjalo marcado como pendiente.
- El uso de IA se declara en el Anexo A del informe. Al cerrar cada tarea, resume qué partes generaste tú para que José lo declare con precisión.
- José tiene que poder explicar el código en la Review. Explica las decisiones en lenguaje simple y no agregues complejidad que no haga falta.
- Si redactas texto para el informe (APA 7), escríbelo con la voz de José: personal y neutral, sin sonar robótico. Formaliza sus ideas en lugar de reemplazarlas.

## Entregable 2 (para cuando trabajemos el informe)

- Exposición: Sprint Review del Incremento 1, 10 minutos, demo en vivo desde el entorno desplegado. Se admite una sola lámina de contexto (Sprint Goal, ítems y su estado, menos de 1 minuto); las diapositivas, capturas o videos penalizan.
- Informe: el del Entregable 1 actualizado con las observaciones, más la sección 3.1: 3.1.1 Sprint Planning (acta, sprint goal, sprint backlog con tareas, capacidad y velocidad), 3.1.2 Daily Scrum (bitácora e impedimentos), 3.1.3 Desarrollo y seguimiento (tablero, burndown, incremento contra la DoD), 3.1.4 Sprint Review (acta y feedback convertido en ítems del backlog), 3.1.5 Retrospective (mantener, mejorar, dejar; matriz de compromisos) y 3.1.6 Cierre (portafolio de evidencias, matriz de trazabilidad y métricas).
- Pendientes del informe 1: en la Tabla 6 faltan "modelo evaluado" y "COMPLETAR: p. ej. Trello"; en la Tabla 8 falta la URL de producción; las fechas de las entrevistas dicen febrero de 2026; la carrera de José debe decir Redes y Seguridad Informática; y los prototipos muestran "Clase a Slides/Quiz" en lugar de Recall ISIL.

## Material en `contexto/`

- Informe del Entregable 1 (Sprint 0, "3709 AV1-Grupo-01", APA 7): usuarios, requerimientos, product backlog con criterios de aceptación, prototipos de Figma (Figuras 6 a 11) y riesgos.
- Toma de ahí la guía de estilos y el flujo de pantallas. Recuerda que el nombre correcto del producto es Recall ISIL.
