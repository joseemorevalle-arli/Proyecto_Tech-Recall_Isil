# Casos de prueba · Sprint 1 · HU06

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado** y **Evidencia** las completa QA (Carlos León) al ejecutar las pruebas.

- Entorno: local con `npm run demo` (el Sprint 1 se presenta en local)
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_

## Preparación

- `.env.local` necesita `GEMINI_API_KEY` (ver `.env.example`). Sin ella, «Generar Curso» siempre termina en error.
- Con `npm run demo` encendido, iniciar sesión con una cuenta de `DEMO_ACCOUNTS` y abrir `/cargar-silabo`.
- Un PDF de sílabo oficial de ISIL que traiga la tabla «Programación de contenidos». Se anota de antemano cuántas unidades y sesiones tiene, para compararlas con el resultado.
- La generación usa Gemini (servicio externo): puede tardar entre 5 y 30 segundos y, en horas de mucha demanda, responder con error. Ese caso es el escenario 3.
- El PDF completo se envía a Gemini para leerlo y se borra de Google al terminar.

## HU06 · Generación de la estructura del curso (SCRUM-15)

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU06-01 | Generación exitosa (criterio 1) | 1. Subir y validar el PDF del sílabo. 2. Pulsar «Generar Curso». | Aparece «¡Curso creado y guardado en tu cuenta!» con el enlace «Ver mi curso». Al abrirlo, el curso muestra el nombre, las unidades y las sesiones tal como están en el sílabo, en el mismo orden. En http://127.0.0.1:4100/firestore el documento está en `users/{uid}/courses/{courseId}` con `name`, `units`, `sourceFile` y `createdAt`. | | |
| HU06-02 | Generación en proceso (criterio 2) | 1. Subir y validar el sílabo. 2. Pulsar «Generar Curso» y mirar la pantalla mientras trabaja. 3. Intentar pulsar el botón otra vez. | El botón muestra «Generando curso... puede tardar un momento» y está deshabilitado. El campo de archivo y «Validar Sílabo» también quedan deshabilitados. | | |
| HU06-03 | Error de generación y reintento (criterio 3) | 1. Quitar `GEMINI_API_KEY` de `.env.local` y reiniciar la app (o desconectar la red). 2. Subir, validar y pulsar «Generar Curso». 3. Restaurar la clave o la red, reiniciar si hace falta, y pulsar «Reintentar Generar Curso» **sin volver a elegir el archivo**. | Tras el fallo aparece «No se pudo generar el curso. Inténtalo de nuevo.» sin ningún texto técnico. El archivo sigue elegido y el botón dice «Reintentar Generar Curso». Al reintentar con la clave o la red restauradas, se crea el curso (como en HU06-01). | | |
| HU06-04 | El curso no se duplica | Tras crear el curso (HU06-01), intentar pulsar de nuevo «Generar Curso». | El botón queda deshabilitado, no hay forma de crear un segundo curso desde esa pantalla. En «Mis cursos» aparece una sola vez. | | |
| HU06-05 | El curso aparece en «Mis cursos» (complementaria) | Después de HU06-01, abrir «Mis cursos». | El curso nuevo aparece en la lista con su número de unidades y sesiones. Al abrirlo se ven las unidades y sesiones. | | |
| HU06-06 | Curso solo del estudiante (complementaria) | Con otra cuenta, abrir la dirección del curso creado (`/cursos/<id>`). | Se muestra «No tienes acceso a este curso». | | |
| HU06-07 | Curso nuevo cada vez (complementaria) | Generar el curso desde el mismo sílabo dos veces (volviendo a abrir `/cargar-silabo`). | Se crean dos cursos distintos. La HU12 (Sprint 4) es la que detectará duplicados de clases. | | |
| HU06-08 | Sin sesión (complementaria) | En una ventana de incógnito, abrir `/cargar-silabo`. | Se redirige a «Iniciar sesión». | | |
| HU06-09 | Cambiar de archivo después de generar (complementaria) | Con el curso ya creado, quitar el archivo con la «X» o elegir otro. | El aviso de éxito y el enlace desaparecen. «Generar Curso» vuelve a quedar deshabilitado hasta validar el nuevo archivo. | | |
| HU06-10 | El servidor revisa el PDF otra vez (complementaria) | Es una prueba técnica: enviar a la acción de generar un PDF que no es sílabo (por ejemplo, saltándose la pantalla con las herramientas del navegador). | El servidor responde con el mensaje de «sílabo oficial de ISIL» y no llama a Gemini ni crea ningún curso. | | |
| HU06-11 | Sin clave de Gemini (complementaria) | Quitar `GEMINI_API_KEY` y reiniciar la app. Pulsar «Generar Curso». | Aparece el mensaje genérico de error. No se muestra la causa ni se crea ningún curso. | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| HU06-UI-01 | Generar un curso en un móvil (375 px de ancho) | El mensaje de éxito, el enlace «Ver mi curso» y el mensaje de error caben en el ancho de la pantalla sin desplazamiento horizontal. | | |
| HU06-UI-02 | La misma pantalla en escritorio | La tarjeta queda centrada y los botones ocupan todo su ancho. | | |

## Pruebas automáticas

`npm test` cubre, con una respuesta de Gemini simulada (no se llama a la red):

- La conversión de la respuesta de Gemini al formato del curso: nombre, unidades y sesiones, espacios sobrantes, numeración y descarte de unidades o sesiones vacías.
- El rechazo de respuestas sin unidades, sin nombre, mal formadas o que no son un objeto.
- El corte por tiempo de espera, el borrado del PDF en Google y que un error al borrar no rompa nada.
