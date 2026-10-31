# Casos de prueba · Sprint 2 · HU09

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado QA** y **Validación PO** las completan Carlos León (QA) y el Product Owner; lo que sigue en «Resultado del desarrollador» es lo que se observó al verificar durante el desarrollo, no sustituye la prueba de QA.

- Entorno de la verificación del desarrollador: local, emuladores de Firebase (Java 21), app en `localhost:3000`, microservicio `recall_isil_api` en `localhost:4652` con una clave de prueba y un proxy de prueba delante (solo para forzar el error y el «sin subtítulos»; no es parte del producto).
- Fecha de la verificación del desarrollador: 30/10/2026.
- Ejecutado por QA: _(pendiente)_ · Fecha: _(pendiente)_
- No se probó contra Render ni contra el Firebase real, solo en local.

## Preparación

- Dos cuentas: **A** (con un curso, por ejemplo `npm run seed:cursos -- <correo de A>`) y **B** (sin ese curso).
- Variables en `.env.local`: `TRANSCRIPTION_SERVICE_URL` y `TRANSCRIPTION_API_KEY` (ver README). El microservicio debe tener la misma clave en su `TRANSCRIPTION_API_KEY`.
- Un enlace real de grabación de Zoom **con** transcripción (lo aporta el equipo; lleva un token de acceso, no se sube al repositorio) y uno de una grabación **sin** subtítulos. Para el error, apagar el microservicio o poner una URL que no responda.

## HU09 · Obtención automática de la transcripción

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Captura | Resultado QA |
|---|---|---|---|---|---|---|
| HU09-01 | Transcripción obtenida (criterio 1) | 1. Cuenta A, abrir un curso y registrar una clase con el enlace real. 2. Pulsar «Obtener transcripción». 3. Mirar mientras tarda. 4. Recargar. | Mientras tarda se ve «Obteniendo la transcripción…» y el botón queda deshabilitado. Al terminar, «Transcripción lista» y el botón desaparece; sigue así tras recargar. | Cumplido. Tardó ~12,7 s con el servicio real. | HU09-01, 02, 03, 04 | _(pendiente)_ |
| HU09-02 | La transcripción queda guardada (criterio 1) | Después de HU09-01, revisar la clase en Firestore. | La clase tiene `transcript` que empieza por `WEBVTT` y `transcribedAt`. | Cumplido: 95 945 caracteres, empieza por `WEBVTT`. | n/a (consulta al emulador) | _(pendiente)_ |
| HU09-03 | Grabación sin transcripción (criterio 3) | 1. Registrar una clase con el enlace de una grabación sin subtítulos. 2. «Obtener transcripción». | Se ve «Esta grabación no tiene transcripción disponible». La clase no queda como transcrita ni guarda `transcript`. | Cumplido. El botón sigue disponible, también tras recargar. | HU09-05 | _(pendiente)_ |
| HU09-04 | Servicio no disponible (criterio 2) | 1. Registrar una clase con un enlace que haga fallar al servicio (o apagarlo). 2. «Obtener transcripción». 3. Pulsar «Reintentar». 4. Entrar a editar la clase. | Se ve el error y el botón pasa a «Reintentar». El nombre y el enlace siguen intactos. | Cumplido. El mensaje es «No pudimos obtener la transcripción. El servicio puede estar iniciando; inténtalo de nuevo en un minuto.» | HU09-06, 07, 08 | _(pendiente)_ |
| HU09-05 | Reintento exitoso tras el error (criterio 2) | 1. Con el servicio caído, procesar una clase con el enlace real (error). 2. Levantar el servicio. 3. «Reintentar». | Queda «Transcripción lista». | Cumplido. | HU09-09, 10 | _(pendiente)_ |
| HU09-06 | Solo el dueño (seguridad) | 1. Con la cuenta B, abrir `/cursos/<id del curso de A>`. 2. Enviar la acción de procesar con una clase de A desde la sesión de B. | «No tienes acceso a este curso». La clase de A no cambia. | Cumplido. El envío con una clase ajena se probó por HTTP directo (no hay forma de hacerlo desde la pantalla). | HU09-11 | _(pendiente)_ |
| HU09-07 | Pantalla de celular | Ver la lista con una clase transcrita y otra con error a 375 px de ancho. | Sin desborde horizontal. | Cumplido (ancho 375 = ancho visible). | HU09-12 | _(pendiente)_ |
| HU09-08 | Sin secretos en los registros | Revisar el registro de la app tras las pruebas. | No aparece la clave compartida ni el token del enlace de Zoom. | Cumplido (0 apariciones en 188 líneas). | n/a | _(pendiente)_ |

Capturas en `docs/pruebas/capturas/` (`HU09-01-…` a `HU09-12-…`).

## Pruebas automáticas

- App: `npm test` (19 pruebas nuevas en `src/lib/transcription/`: descarga solo desde Zoom, 404 sin subtítulos, error 500, timeout, VTT sin intervenciones, límite de tamaño, que los errores no filtren la clave ni el enlace).
- Microservicio (`recall_isil_api`, rama `feature/clave-compartida`): `npm test`, 29 pruebas, 8 nuevas de la clave compartida. Revisión independiente de solo lectura: sin defectos críticos ni altos.

## No cubierto por esta verificación

- Render y arranque en frío reales (se simuló con el interruptor del proxy, no con el servicio dormido de verdad).
- Firebase real y Vercel: el Sprint se presenta en local con emuladores.
- Un archivo de transcripción de una clase muy larga cerca del límite de ~800 KB: solo está cubierto por la prueba automática, no se probó en pantalla.
- Que el enlace de Zoom siga sirviendo después de que el token del enlace venza: depende de Zoom.
