# Casos de prueba · Sprint 3 · HU10, HU17, HU04, HU14 y HU13

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado QA** y **Validación PO** las completan Carlos León (QA) y el Product Owner. Lo que figura en «Resultado del desarrollador» es lo que se observó al verificar durante el desarrollo; no sustituye la prueba de QA.

- Entorno de la verificación del desarrollador: local, emuladores de Firebase (`demo-recall-isil`), app en `localhost:3000` con `npm run dev`. Fecha: 04/11/2026. Ejecutado por QA: _(pendiente)_.
- **Sin** `GEMINI_API_KEY` ni servicio de transcripción en esa máquina: la generación real del resumen con Gemini **no se probó**. Para ver cómo se muestra un resumen guardado y para resolver un cuestionario se escribieron un resumen y un cuestionario de prueba directamente en el emulador (no los generó la IA).
- No se probó en Vercel ni con el Firebase real (el envío real del correo de verificación tampoco). No se tomaron capturas: el panel del navegador estaba oculto durante la prueba.
- Los archivos subidos en HU17 se cargaron en el formulario por script (el panel del navegador no abre el selector de archivos del sistema); la validación y el guardado corrieron por el flujo normal del servidor.
- Claves de Jira de las subtareas: _(pendientes)_.

## HU13 · Acceso a la grabación original

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Resultado QA |
|---|---|---|---|---|---|
| HU13-01 | Abrir grabación | En el curso, pulsar el nombre de una clase y luego «Ver grabación». | Se abre el enlace de Zoom de la clase en una pestaña nueva. | El enlace apunta al `zoomUrl` de la clase, con `target="_blank"` y `rel="noopener noreferrer"`. No se abrió la grabación real (el enlace de prueba no existe en Zoom). | _(pendiente)_ |

## HU17 · Carga manual de la transcripción

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Resultado QA |
|---|---|---|---|---|---|
| HU17-01 | Acceso tras el fallo automático | Pulsar «Obtener transcripción» sin servicio disponible. | Error con «Reintentar» y el enlace «Subir la transcripción manualmente», que lleva al detalle de la clase. | Cumplido (servicio no configurado en local). | _(pendiente)_ |
| HU17-02 | Carga válida .vtt (escenario 1) | Subir un `.vtt` con 8 intervenciones. | Se guarda; se ve «Transcripción lista · subida por ti» y se habilitan «Generar resumen» y «Generar cuestionario». | Cumplido. | _(pendiente)_ |
| HU17-03 | Otro formato (escenario 2) | Elegir un `.pdf`. | «Formato no permitido. Solo se aceptan archivos .vtt o .txt.» y no se puede subir. | Cumplido (botón deshabilitado). | _(pendiente)_ |
| HU17-04 | Archivo vacío (escenario 2) | Elegir un `.txt` vacío. | «El archivo está vacío. Elige un archivo con la transcripción de la clase.» | Cumplido. | _(pendiente)_ |
| HU17-05 | Binario renombrado (escenario 2) | Subir un binario con nombre `notas.txt`. | El servidor responde «No pudimos leer el archivo…» y la clase sigue sin transcripción. | Cumplido. | _(pendiente)_ |
| HU17-06 | Carga válida .txt | Subir un `.txt` con texto de la clase. | Igual que HU17-02. | Cubierto solo por pruebas automáticas. | _(pendiente)_ |

## HU10 · Resumen de la clase por temas

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Resultado QA |
|---|---|---|---|---|---|
| HU10-01 | Resumen generado (escenario 1) | En una clase con transcripción, pulsar «Generar resumen». | Mientras trabaja, «Generando el resumen…»; luego, los temas con sus ideas clave. | **No probado con Gemini real** (sin clave en local). Con la clave ausente se ve «No pudimos generar el resumen…» con «Reintentar». | _(pendiente)_ |
| HU10-02 | Fiel a la clase (escenario 2) | Comparar cada tema con la transcripción. | Cada tema muestra la frase de la clase («En clase se dijo: …») y ningún tema es ajeno a la clase. | Probado con pruebas automáticas (temas sin respaldo se descartan; si son más de la mitad, el intento falla). Falta probarlo con Gemini real. | _(pendiente)_ |
| HU10-03 | Resumen guardado (escenario 3) | Volver a abrir la clase. | Se ve el mismo resumen, con «Generado el …», sin el botón de generar. | Cumplido con un resumen escrito en el emulador. La acción devuelve el guardado sin llamar a la IA (revisión de código). | _(pendiente)_ |

## HU04 · Verificación del correo

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Resultado QA |
|---|---|---|---|---|---|
| HU04-01 | Enlace al crear la cuenta (escenario 1) | Crear una cuenta nueva. | Firebase envía el enlace; las páginas privadas muestran «Verifica tu correo». | Cumplido en el emulador: el enlace quedó registrado en `oobCodes` y apareció el aviso. | _(pendiente)_ |
| HU04-02 | Cuenta sin verificar (escenario 2) | Sin verificar, pulsar «Generar resumen» y «Generar cuestionario». | Aviso «Verifica tu correo para generar contenido…» y no se genera nada. | Cumplido para resumen y cuestionario. Generar curso (HU06) tiene la misma comprobación, pero no se probó en pantalla (faltaba un sílabo de prueba). | _(pendiente)_ |
| HU04-03 | Reenvío del enlace (escenario 3) | Pulsar «Reenviar enlace». | «Te enviamos un nuevo enlace a {correo}…» y llega un enlace nuevo. | Cumplido: segundo enlace registrado en el emulador. | _(pendiente)_ |
| HU04-04 | Verificación exitosa (escenario 1) | Abrir el enlace y recargar. | El aviso desaparece y las generaciones ya no se bloquean por el correo. | Cumplido con el enlace reenviado. | _(pendiente)_ |

## HU14 · Historial de cuestionarios y puntajes

| ID | Escenario | Pasos | Resultado esperado | Resultado del desarrollador | Resultado QA |
|---|---|---|---|---|---|
| HU14-01 | Sin intentos (escenario 3) | Abrir «Mi historial» sin haber resuelto nada. | «Aún no resuelves cuestionarios» con cómo empezar y «Ir a mis cursos». | Cumplido. | _(pendiente)_ |
| HU14-02 | Historial con intentos (escenario 1) | Resolver un cuestionario y abrir «Mi historial». | Al terminar se ve «Intento guardado en tu historial»; el historial muestra por curso la clase, la fecha y el puntaje. | Cumplido (10 de 10). | _(pendiente)_ |
| HU14-03 | Nuevo intento (escenario 2) | «Resolver de nuevo» y terminar otra vez. | Se guarda un intento nuevo y el anterior sigue. | Cumplido: el historial mostró 5 de 10 y 10 de 10, «2 intentos · mejor puntaje 10 de 10». | _(pendiente)_ |
| HU14-04 | Limpieza | Eliminar la clase. | Sus intentos desaparecen del historial. | Cumplido (la colección de intentos quedó vacía). | _(pendiente)_ |

## Pruebas automáticas

`npm test`: 154 pruebas, todas pasan. Las nuevas cubren la validación del archivo de transcripción (HU17), la conversión de VTT o TXT a texto, la generación del resumen con reintento, tiempo máximo y descarte de temas sin respaldo (HU10), y la validación y agrupación de los intentos (HU14).

## Pendiente

- Probar la HU10 con Gemini real y revisar a mano que los temas coincidan con la clase.
- Probar la HU04 con el Firebase real (que el correo llegue a un buzón de `mail.isil.pe`) y la pantalla de celular (375 px) de las páginas nuevas.
