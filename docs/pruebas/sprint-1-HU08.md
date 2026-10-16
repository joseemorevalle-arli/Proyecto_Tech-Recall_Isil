# Casos de prueba · Sprint 1 · HU08

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado** y **Evidencia** las completa QA (Carlos León) al ejecutar las pruebas.

- Entorno: local con `npm run demo` (el Sprint 1 se presenta en local)
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_

## Preparación

- Con `npm run demo` encendido, se necesitan dos cuentas: **A** (con al menos un curso) y **B** (sin ese curso). Pueden ser dos correos de `DEMO_ACCOUNTS` o una cuenta creada en «Crear cuenta».
- Para darle un curso a la cuenta A: generarlo desde «Subir sílabo» (HU05 y HU06) o, en otra terminal, ejecutar `npm run seed:cursos -- <correo de A>`.
- Enlaces de prueba. Solo se revisa el formato: hasta la HU09 no hace falta que la grabación exista.

| Enlace | Caso |
|---|---|
| `https://isil-pe.zoom.us/rec/play/AbC123-xyz.456` | Válido |
| `https://isil-pe.zoom.us/rec/play/AbC123?startTime=1700000000000` | Válido, con parámetros |
| `https://isil-pe.zoom.us/rec/share/AbC123` | Enlace para compartir (no es de reproducción) |
| `https://zoom.us/rec/play/AbC123` | Otro dominio |
| `http://isil-pe.zoom.us/rec/play/AbC123` | Sin https |
| `https://isil-pe.zoom.us/rec/play/` | Incompleto (falta el código de la grabación) |

## HU08 · Registro de clase con enlace de Zoom (SCRUM-17)

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU08-01 | Registro exitoso | 1. Iniciar sesión con la cuenta A y abrir un curso. 2. Pulsar «Registrar clase». 3. Escribir el nombre «Sesión 1: Introducción». 4. Pegar el enlace válido. 5. Pulsar «Registrar clase». | El botón muestra «Registrando clase…» y los campos se deshabilitan. Se vuelve al curso con el aviso «Clase registrada» y la clase aparece primera en «Clases registradas», con su fecha y hora de registro. En http://127.0.0.1:4000/firestore la clase está en `users/{uid}/courses/{courseId}/classes` con `name`, `zoomUrl` y `createdAt`. | | |
| HU08-02 | Solo acepta el formato de ISIL (criterio 1) | 1. En «Registrar clase», escribir un nombre. 2. Pegar, uno por uno, el enlace para compartir, el de otro dominio, el que no usa https y el incompleto. 3. Pegar el enlace válido con parámetros. | Con cada enlace de los pasos 2 se muestra «El enlace debe tener el formato https://isil-pe.zoom.us/rec/play/...», el campo se marca en rojo y el botón «Registrar clase» sigue deshabilitado. Con el del paso 3 se muestra «Enlace de Zoom válido». | | |
| HU08-03 | Validación mientras escribe (criterio 2) | 1. En «Registrar clase», escribir a mano `https://isil-pe.zoom.us/rec/play/abc`. 2. Borrar las letras `abc`. | Mientras el enlace está incompleto se ve el mensaje de formato en rojo. Al escribir la primera letra después de `/rec/play/` cambia a «Enlace de Zoom válido» en verde, sin pulsar ningún botón. Al borrar `abc` vuelve el mensaje de error. | | |
| HU08-04 | Nombre obligatorio (criterio 3) | 1. En «Registrar clase», pegar el enlace válido y dejar el nombre vacío. 2. Escribir un nombre. 3. Borrarlo. | Sin nombre, el botón está deshabilitado y debajo aparece «Escribe el nombre de la clase para continuar.» Al escribir el nombre se habilita y al borrarlo se deshabilita otra vez. | | |
| HU08-05 | Nombre con solo espacios (complementaria) | Con el enlace válido, escribir solo espacios en el nombre. | El botón sigue deshabilitado. | | |
| HU08-06 | Validación en el servidor (complementaria) | 1. En «Registrar clase», pegar el enlace válido y dejar el nombre vacío. 2. En DevTools (Elements), quitar el atributo `disabled` del botón «Registrar clase». 3. Pulsar el botón. | El servidor rechaza el envío: aparece «Escribe el nombre de la clase» debajo del nombre y la clase no se guarda (no aparece en el curso ni en el emulador). | | |
| HU08-07 | Curso de otro estudiante (complementaria) | 1. Con la cuenta A, abrir «Registrar clase» en un curso y copiar la dirección (`/cursos/<id>/clases/nueva`). 2. Cerrar sesión e iniciar con la cuenta B. 3. Abrir la dirección copiada. | Se muestra «No tienes acceso a este curso» y no aparece el formulario. | | |
| HU08-08 | Curso ajeno al enviar (complementaria) | 1. Con la cuenta A, abrir «Registrar clase», escribir un nombre y pegar el enlace válido. 2. En DevTools (Elements), cambiar el `value` del campo oculto `courseId` por `no-existe`. 3. Pulsar «Registrar clase». | Se muestra «No tienes acceso a este curso», el nombre y el enlace escritos se mantienen y no se guarda ninguna clase. | | |
| HU08-09 | Curso sin clases (complementaria) | Abrir un curso que no tenga clases. | En «Clases registradas» se ve «Aún no registras clases», un texto que explica qué hacer y el botón «Registrar clase». | | |
| HU08-10 | Sin sesión (complementaria) | En una ventana de incógnito, abrir `/cursos/<id>/clases/nueva`. | Se redirige a «Iniciar sesión». | | |
| HU08-11 | Estado de carga (complementaria) | Con la red limitada (DevTools → Network → Slow 4G), abrir «Registrar clase» desde un curso y luego enviar una clase válida. | Mientras carga el formulario se ven bloques grises animados. Al enviar, el botón muestra «Registrando clase…» hasta volver al curso. | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| HU08-UI-01 | Abrir un curso y «Registrar clase» en un móvil (375 px de ancho) | El formulario ocupa el ancho de la pantalla, los mensajes del enlace pasan a la siguiente línea y no hay desplazamiento horizontal. En el curso, el botón «Registrar clase» queda debajo del nombre del curso. | | |
| HU08-UI-02 | Abrir las mismas pantallas en escritorio | El formulario queda centrado y el botón «Registrar clase» del curso queda a la derecha de su nombre. | | |
