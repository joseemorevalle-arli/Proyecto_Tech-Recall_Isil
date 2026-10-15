# Casos de prueba · Sprint 1 · HU07

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado obtenido** y **Evidencia** se completan al ejecutar las pruebas en staging.

- Entorno: _(pendiente: URL de staging)_
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_

## Preparación

Se necesitan dos cuentas: **A** (con cursos) y **B** (sin cursos).

- En staging, la cuenta A genera sus cursos desde el sílabo (HU05 y HU06).
- En local, mientras la HU06 no esté integrada: con `npm run emulators` y `npm run dev` corriendo, crear la cuenta A en «Crear cuenta» y ejecutar `npm run seed:cursos -- <correo de A>`. El script crea dos cursos de prueba y muestra el enlace directo de cada uno.

## HU07 · Lista de mis cursos (SCRUM-16)

| ID | Escenario | Pasos | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|
| HU07-01 | Con cursos | 1. Iniciar sesión con la cuenta A. | Se abre «Mis cursos» con una tarjeta por cada curso de A (nombre, número de unidades y de sesiones), ordenadas por nombre. No aparecen cursos de otras cuentas. | | |
| HU07-02 | Abrir un curso | 1. Con la cuenta A en «Mis cursos», pulsar la tarjeta de un curso. | Se abre el curso con su nombre y sus unidades; cada unidad muestra sus sesiones. El botón «Mis cursos» regresa a la lista. | | |
| HU07-03 | Sin cursos | 1. Iniciar sesión con la cuenta B. | Se muestra «Aún no tienes cursos», un texto que invita a empezar y el botón «Subir sílabo». | | |
| HU07-04 | Curso de otro estudiante | 1. Con la cuenta A, copiar la dirección de uno de sus cursos (`/cursos/<id>`). 2. Cerrar sesión e iniciar con la cuenta B. 3. Pegar la dirección copiada. | Se muestra «No tienes acceso a este curso» y no se ve ningún dato del curso de A. | | |
| HU07-05 | Enlace inexistente (complementaria) | Con cualquier cuenta, abrir `/cursos/no-existe`. | Se muestra «No tienes acceso a este curso». | | |
| HU07-06 | Sin sesión (complementaria) | En una ventana de incógnito, abrir el enlace directo de un curso. | Se redirige a «Iniciar sesión». | | |
| HU07-07 | Estado de carga (complementaria) | Con la red limitada (DevTools → Network → Slow 4G), abrir «Mis cursos» y luego un curso. | Mientras cargan, se ven bloques grises animados en lugar de la página vacía. | | |
| HU07-08 | Estado de error (complementaria) | En local, sin `npm run emulators`: 1. Levantar solo Auth con `npx firebase emulators:start --only auth --project demo-recall-isil` (Firestore queda apagado). 2. Crear una cuenta e iniciar sesión. 3. Esperar en «Mis cursos». | Primero se ve el estado de carga y, cuando Firestore deja de reintentar (alrededor de 30 a 40 segundos), se muestra «No pudimos cargar tus cursos» con el botón «Reintentar». | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|
| HU07-UI-01 | Abrir «Mis cursos» y un curso en un móvil (375 px de ancho) | Las tarjetas se apilan en una columna, los nombres largos pasan a la siguiente línea y no hay desplazamiento horizontal. | | |
| HU07-UI-02 | Abrir «Mis cursos» en escritorio | Las tarjetas se muestran en dos columnas. | | |
