# Casos de prueba · CRUD de cursos y clases

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado** y **Evidencia** las completa QA (Carlos León) al ejecutar las pruebas.

Completa lo que ya existía (crear y ver cursos y clases, HU06, HU07 y HU08) con **editar** y **eliminar**.

- Entorno: local con `npm run demo` (el Sprint 1 se presenta en local)
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_

## Preparación

- Se necesitan dos cuentas: **A** (con un curso y al menos una clase) y **B** (con otro curso). Para tener un curso, subir un sílabo (HU05 y HU06) o ejecutar `npm run seed:cursos -- <correo>`.
- Para las pruebas con datos de otra cuenta hay que copiar las direcciones (`/cursos/<id>`) desde la sesión de B.
- Los casos marcados como **técnicos** manipulan el formulario con las herramientas del navegador (DevTools). Simulan a alguien que intenta saltarse las protecciones de la pantalla.
- Para ver qué hay realmente guardado: http://127.0.0.1:4100/firestore (Authentication y Firestore del emulador).

## Cursos

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| CRUD-C01 | Editar el nombre | 1. Abrir un curso y pulsar «Editar curso». 2. Cambiar el nombre. 3. Pulsar «Guardar cambios». | Se vuelve al curso con el aviso «Curso actualizado» y el nuevo nombre. En «Mis cursos» también aparece con el nombre nuevo. | | |
| CRUD-C02 | Editar títulos de unidades y sesiones | Cambiar el título de una unidad y el de una sesión y guardar. | El curso muestra los títulos nuevos. | | |
| CRUD-C03 | Agregar unidad y sesión | 1. Pulsar «Agregar unidad» y escribir su título. 2. En esa unidad, pulsar «Agregar sesión» y escribirla. 3. Guardar. | La unidad y la sesión aparecen al final del curso. | | |
| CRUD-C04 | Quitar una sesión y una unidad | 1. Pulsar el tacho de una sesión y el de una unidad. 2. Guardar. | Desaparecen del curso. La numeración queda corrida, sin huecos (las sesiones siguen 1, 2, 3… en todo el curso). | | |
| CRUD-C05 | Reordenar | Subir una unidad por encima de otra y bajar una sesión. Guardar. | El orden nuevo se ve en el curso y los números de unidad y de sesión se recalculan en ese orden. | | |
| CRUD-C06 | Validación en pantalla | 1. Borrar el nombre del curso. 2. Dejar vacío el título de una unidad o de una sesión. | Aparece el mensaje en rojo («Escribe el nombre del curso», «Cada unidad necesita un título» o «Cada sesión necesita un título») y «Guardar cambios» queda deshabilitado, con una nota debajo. | | |
| CRUD-C07 | Validación en el servidor (técnico) | 1. En «Editar curso», borrar el nombre. 2. En DevTools (Elements), quitar el atributo `disabled` del botón «Guardar cambios». 3. Pulsarlo. | Aparece «Escribe el nombre del curso» y el curso queda como estaba. | | |
| CRUD-C08 | Curso de otra cuenta al guardar (técnico) | 1. En «Editar curso», cambiar con DevTools el `value` del campo oculto `courseId` por un id que no es de la cuenta (por ejemplo el curso de B). 2. Pulsar «Guardar cambios». | Aparece «No tienes acceso a este curso» y no se modifica ningún curso. | | |
| CRUD-C09 | Editar un curso ajeno por la dirección | Con la cuenta A, abrir `/cursos/<id de B>/editar`. | Se muestra «No tienes acceso a este curso» y no aparece el formulario. | | |
| CRUD-C10 | Las clases no se tocan al editar | Con un curso que tenga clases, editarlo y guardar. | Las clases registradas siguen igual, con su nombre, enlace y fecha. | | |
| CRUD-C11 | Eliminar: pide confirmación | En un curso con 2 clases, pulsar «Eliminar curso». | Se abre «¿Eliminar este curso?» con el nombre del curso, cuántas clases se borrarán y «Esta acción no se puede deshacer». Hay «Cancelar» y «Sí, eliminar». | | |
| CRUD-C12 | Cancelar no borra | En el diálogo, pulsar «Cancelar» y volver a abrir el curso. | El curso y sus clases siguen ahí. | | |
| CRUD-C13 | Eliminar el curso y sus clases | Pulsar «Sí, eliminar». | Se vuelve a «Mis cursos» con el aviso «Curso eliminado» y el curso ya no aparece. En el emulador no queda el documento del curso ni su subcolección `classes`. | | |
| CRUD-C14 | Eliminar solo borra lo propio (técnico) | 1. Con la cuenta A, abrir el diálogo de eliminar. 2. Con DevTools, cambiar el `value` del campo oculto `courseId` por el id del curso de B. 3. Pulsar «Sí, eliminar». | Aparece «No tienes acceso a este curso». El curso de B y sus clases siguen en el emulador. | | |
| CRUD-C15 | Eliminar el último curso | Eliminar el único curso de la cuenta. | «Mis cursos» muestra «Aún no tienes cursos» con el botón «Subir sílabo». | | |
| CRUD-C16 | Sin sesión | En una ventana de incógnito, abrir `/cursos/<id>/editar`. | Se redirige a «Iniciar sesión». | | |

## Clases

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| CRUD-L01 | Registrar sigue igual | Registrar una clase nueva con nombre y enlace válidos (como en HU08). | Funciona como antes: «Clase registrada» y aparece en la lista. El botón sigue diciendo «Registrar clase». | | |
| CRUD-L02 | Editar nombre y enlace | 1. En la lista de clases, pulsar el lápiz de una clase. 2. Cambiar el nombre y el enlace por otro válido. 3. Pulsar «Guardar cambios». | Se vuelve al curso con el aviso «Clase actualizada» y la clase muestra el nombre nuevo. La fecha de registro no cambia. | | |
| CRUD-L03 | La edición trae los datos actuales | Abrir la edición de una clase. | El nombre y el enlace aparecen escritos. | | |
| CRUD-L04 | Mismas reglas del registro (criterio de HU08) | En la edición, escribir un enlace de otro dominio, sin https o incompleto. | Se muestra «El enlace debe tener el formato https://isil-pe.zoom.us/rec/play/...» y «Guardar cambios» queda deshabilitado. Con un enlace válido aparece «Enlace de Zoom válido». | | |
| CRUD-L05 | Nombre obligatorio | En la edición, borrar el nombre. | «Guardar cambios» queda deshabilitado y se indica que falta el nombre. | | |
| CRUD-L06 | Validación en el servidor (técnico) | En la edición, borrar el nombre, quitar `disabled` del botón con DevTools y pulsarlo. | Aparece «Escribe el nombre de la clase» y la clase no cambia. | | |
| CRUD-L07 | Editar una clase de un curso ajeno | Con la cuenta A, abrir `/cursos/<id de B>/clases/<cualquier id>/editar`. | Se muestra «No tienes acceso a este curso» y no aparece el formulario. | | |
| CRUD-L08 | Clase que no existe | Abrir `/cursos/<id propio>/clases/no-existe/editar`. | Se muestra «No encontramos esa clase. Puede que ya la hayas eliminado.» y no aparece el formulario. | | |
| CRUD-L09 | Eliminar: pide confirmación | Pulsar el tacho de una clase. | Se abre «¿Eliminar esta clase?» con el nombre y «Esta acción no se puede deshacer». Hay «Cancelar» y «Sí, eliminar». | | |
| CRUD-L10 | Cancelar no borra | Pulsar «Cancelar». | La clase sigue en la lista. | | |
| CRUD-L11 | Eliminar la clase | Pulsar «Sí, eliminar». | Se vuelve al curso con el aviso «Clase eliminada» y la clase ya no está. Si era la última, aparece «Aún no registras clases». | | |
| CRUD-L12 | Eliminar solo borra lo propio (técnico) | 1. Abrir el diálogo de eliminar una clase de A. 2. Con DevTools, cambiar los campos ocultos `courseId` y `classId` por los de una clase de B. 3. Pulsar «Sí, eliminar». | Aparece «No tienes acceso a este curso». Las clases de B siguen en el emulador. | | |
| CRUD-L13 | Clase de otra cuenta en mi curso (técnico) | Igual que el caso anterior, pero cambiando solo `classId` por el de una clase de B. | Aparece «No encontramos esa clase. Puede que ya la hayas eliminado.» y la clase de B sigue en el emulador. | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| CRUD-UI-01 | «Editar curso» en un móvil (375 px) | Los campos ocupan el ancho de la pantalla y los botones de subir, bajar y quitar caben junto a cada título sin desplazamiento horizontal. | | |
| CRUD-UI-02 | El detalle del curso en un móvil | Los botones «Editar curso», «Eliminar curso» y «Registrar clase» pasan a otra línea sin cortarse, y el lápiz y el tacho de cada clase siguen visibles. | | |
| CRUD-UI-03 | Los diálogos de confirmación en un móvil | El diálogo cabe en la pantalla y sus dos botones se pueden pulsar. | | |

## Pruebas automáticas

`npm test` cubre la validación de la edición de un curso (`src/lib/courses/edit.test.ts`): el formato guardado, la renumeración al quitar o mover filas sin confiar en los números del navegador, el recorte de espacios, los límites de largo y de cantidad, los datos mal formados y que se ignoren los campos de más.

## Evidencia preliminar del desarrollo

Capturas del desarrollador (José More Valle) tomadas en local durante la implementación. No sustituyen la ejecución de QA ni los resultados de las columnas anteriores.

| Captura | Muestra |
|---|---|
| [01](capturas/CRUD-01-detalle-con-editar.png) | Detalle del curso con «Editar curso» |
| [02](capturas/CRUD-02-editar-curso.png) | Pantalla «Editar curso» |
| [03](capturas/CRUD-03-editando.png) | Editando: unidad y sesiones agregadas |
| [04](capturas/CRUD-04-curso-actualizado.png) | «Curso actualizado» |
| [05](capturas/CRUD-05-nombre-vacio.png) | Nombre vacío: guardar deshabilitado |
| [06](capturas/CRUD-06-confirmar-eliminar-curso.png) | Confirmación para eliminar un curso |
| [07](capturas/CRUD-07-eliminar-curso-ajeno.png) | Intento de eliminar un curso ajeno |
| [08](capturas/CRUD-08-curso-eliminado.png) | «Curso eliminado» |
| [09](capturas/CRUD-09-clase-con-acciones.png) | Lista de clases con lápiz y tacho |
| [10](capturas/CRUD-10-editar-clase.png) | Pantalla «Editar clase» |
| [11](capturas/CRUD-11-editar-clase-enlace-invalido.png) | Edición con enlace inválido |
| [12](capturas/CRUD-12-clase-actualizada.png) | «Clase actualizada» |
| [13](capturas/CRUD-13-confirmar-eliminar-clase.png) | Confirmación para eliminar una clase |
| [14](capturas/CRUD-14-eliminar-clase-ajena.png) | Intento de eliminar una clase ajena |
| [15](capturas/CRUD-15-clase-eliminada.png) | «Clase eliminada» |
