# Casos de prueba · Sprint 2 · HU11

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado QA** y **Validación PO** las completan Carlos León (QA) y el Product Owner. Lo que figura en «Resultado del desarrollador» es lo que se observó al verificar durante el desarrollo; no sustituye la prueba de QA.

- Entorno de la verificación del desarrollador: local, emuladores de Firebase, app en `localhost:3000`. Para los casos de error se usó un **Gemini simulado** que se puede forzar a responder incompleto, caído o sin responder. Para el caso feliz se hizo además **una** pasada con Gemini real.
- Fecha: 30/10/2026. Ejecutado por QA: _(pendiente)_.
- No se probó en Vercel ni con el Firebase real.

## Preparación

- Variables en `.env.local`: `GEMINI_API_KEY` (la misma de la HU06) y las de la HU09 para obtener transcripciones (ver README).
- Una clase con transcripción (HU09). Sin transcripción, el cuestionario no se puede generar.
- Dos cuentas: **A** (con la clase) y **B** (sin ese curso).

## HU11 · Cuestionario de 10 preguntas (SCRUM-_pendiente_)

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Captura | Resultado QA |
|---|---|---|---|---|---|---|
| HU11-01 | Cuestionario generado (criterio 1) | 1. Cuenta A, curso con una clase transcrita. 2. Pulsar «Generar cuestionario». | Mientras la IA trabaja se ve «Generando el cuestionario…» con el botón bloqueado. Luego se abre el cuestionario: 10 preguntas, 3 alternativas, una correcta. | Cumplido con Gemini simulado. El botón sólo aparece en clases con transcripción. Quedó guardado con 10 preguntas de 3 alternativas. | HU11-01, 02, 03 | _(pendiente)_ |
| HU11-02 | Cuestionario con Gemini real | Igual que HU11-01, con la clave real. | Igual que HU11-01. | Cumplido en **una** clase: 32 s, 10 preguntas válidas, mostradas y resueltas en pantalla. Gemini respondió con error a la primera llamada y el reintento automático lo resolvió. | HU11-24, 25, 26 | _(pendiente)_ |
| HU11-03 | Resolución y puntaje (criterio 2) | Resolver el cuestionario de punta a punta. | Se lee «Pregunta n de 10»; «Siguiente» se habilita al elegir; en la 10 el botón es «Ver mi puntaje»; al final, «Tu puntaje final» con «N de 10» y una revisión de cada respuesta. | Cumplido. Se comprobaron 10 de 10, 0 de 10 y 5 de 10. | HU11-04 a 09 | _(pendiente)_ |
| HU11-04 | No se vuelve a gastar IA | Volver al curso y abrir el cuestionario ya generado; recargar. | La clase muestra «Resolver cuestionario». Abrirlo no llama a la IA y sigue ahí tras recargar. | Cumplido (0 llamadas nuevas). | HU11-10, 11, 12 | _(pendiente)_ |
| HU11-05 | Respuesta de IA incompleta (criterio 3) | Forzar que la IA devuelva menos de 10 preguntas. | No se muestra el cuestionario incompleto. Se vuelve a generar una vez; si sigue mal, «No pudimos generar el cuestionario. Inténtalo de nuevo en unos minutos.» con «Reintentar». | Cumplido: 2 llamadas, error visible y nada guardado. Con «primera mal, segunda bien» terminó bien y guardó 10. | HU11-13, 14 | _(pendiente)_ |
| HU11-06 | IA caída | Forzar error de la IA y luego restablecerla. | Error con «Reintentar»; al volver la IA, «Reintentar» llega al cuestionario. | Cumplido. | HU11-15, 16 | _(pendiente)_ |
| HU11-07 | IA que no responde | Forzar que la IA no conteste. | No queda cargando para siempre: a los ~110 s sale el error con «Reintentar». | Cumplido (110 s, 2 llamadas). | HU11-19, 20 | _(pendiente)_ |
| HU11-08 | Clase sin transcripción | Abrir el cuestionario de una clase sin transcripción. | Estado vacío con «Esta clase todavía no tiene transcripción…» y sin botón de generar. | Cumplido; la acción enviada a mano responde lo mismo y no llama a la IA. | HU11-17 | _(pendiente)_ |
| HU11-09 | Solo el dueño | Con la cuenta B, abrir y generar el cuestionario de una clase de A. | «No tienes acceso a este curso», sin llamadas a la IA ni cambios. | Cumplido (pantalla y petición reenviada con la sesión de B). | HU11-18 | _(pendiente)_ |
| HU11-10 | Pantalla de celular | Ver lista, pregunta y puntaje a 375 px. | Sin desborde horizontal; alternativas fáciles de tocar. | Cumplido (ancho 375 = ancho visible; alternativas de 311×50 px). | HU11-21, 22, 23 | _(pendiente)_ |
| HU11-11 | Sin secretos en los registros | Revisar el registro de la app. | No aparece la clave ni texto de la transcripción. | Cumplido en la prueba con Gemini simulado. No se revisó el registro de la pasada con Gemini real. | n/a | _(pendiente)_ |

Capturas en `docs/pruebas/capturas/` (`HU11-01-…` a `HU11-26-…`).

## Pruebas automáticas

`npm test`: 106 pruebas en total. Las de la HU11 (31) cubren la validación estricta del cuestionario (10 preguntas, 3 alternativas distintas, una correcta, sin preguntas repetidas), la limpieza de la transcripción (se quitan tiempos y nombres de quienes hablan), el reintento, el tiempo máximo y que el texto de la clase no pueda colar instrucciones en el pedido a la IA.

## Calidad: «basadas solo en la transcripción» (criterio 1)

Se agregó una defensa: Gemini pide 13 preguntas candidatas y cada una debe traer la frase de la clase que la respalda, copiada textualmente. El sistema comprueba que esa frase aparezca en la transcripción (sin importar mayúsculas, tildes ni puntuación; mínimo 3 palabras y 15 caracteres), descarta las candidatas sin respaldo y entrega las 10 primeras que lo tengan. Si quedan menos de 10, cuenta como intento fallido (reintento único y luego error).

**Lo observado con Gemini real**

| Prueba | Resultado |
|---|---|
| Generador solo, 1 clase (~48 000 caracteres) | 13 candidatas, 10 entregadas. Revisé a mano las 13: todas traían una frase que sí está en la clase y las 10 respuestas se deducen de su frase. 46,9 s. |
| A través de la app, 1 clase | Cuestionario generado, guardado (10×3, sin el campo de evidencia) y resuelto en pantalla. 29,6 s, con un primer intento fallido de Gemini. Captura HU11-27. Las preguntas de esta generación no las revisé a mano. |

**Lo que esto NO demuestra**
- En ninguna de las dos corridas el filtro descartó una candidata por falta de respaldo (las 3 sobrantes de la primera eran excedente). Está probado con pruebas automáticas, pero no se lo vio atrapar en la práctica una pregunta con conocimiento externo del modelo.
- La comprobación es de texto: confirma que la frase citada existe en la clase, **no** que sostenga la respuesta. Un modelo podría citar una frase real y aun así preguntar otra cosa.
- Hay 2 corridas reales sobre una sola clase.

## Límites conocidos

- **Tiempo de generación:** con 13 candidatas, una llamada tardó hasta 47 s, con un tope de 55 s por intento. Si Gemini responde más lento, el intento se corta y se informa el error; es decir, queda poco margen.
- **Gemini real con picos de demanda:** durante las pruebas devolvió error 503 en 4 de 5 llamadas seguidas en un momento dado. Con el reintento automático, a veces no alcanza y el estudiante ve el error con «Reintentar».
- Zoom escribe mal algunos términos técnicos en la transcripción (por ejemplo «Pon Xml» por «pom.xml»). Las preguntas lo citan tal cual, con esa ortografía.
- Los intentos de resolución no se guardan: el historial de cuestionarios es la HU14 (Sprint 3).
- Una clase muy larga puede superar el límite de entrada de la IA; no se probó.
- Solo se probó con una clase.
