# Casos de prueba · Sprint 1 · HU05

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado** y **Evidencia** las completa QA (Carlos León) al ejecutar las pruebas.

- Entorno: local con `npm run demo` (el Sprint 1 se presenta en local)
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_

## Preparación

- Con `npm run demo` encendido, iniciar sesión con una cuenta de `DEMO_ACCOUNTS` y abrir `/cargar-silabo` (botón «Subir sílabo» en «Mis cursos»).
- Archivos de prueba:

| Archivo | Caso |
|---|---|
| PDF de un sílabo oficial de ISIL (descargado del campus) | Válido |
| PDF que no es un sílabo (por ejemplo, una factura o una boleta) | Contenido incorrecto |
| Un documento Word (`.docx`) o una imagen | Formato no permitido |
| Un archivo de texto cuyo nombre se cambió a `.pdf` | PDF falso |
| Un PDF de más de 5 MB | Demasiado grande |

- La validación lee el texto del PDF. Un sílabo es válido si menciona ISIL, la «metodología ISIL», las cinco modalidades (Presencial, Semipresencial, Remota, Semirremota y Virtual), «Sistema de evaluación» y «ESQUEMA DE EVALUACIÓN». Un PDF escaneado como imagen no tiene texto y se rechaza.
- La generación del curso es de la HU06 y todavía no está disponible: en este documento solo se comprueba que «Generar Curso» se habilite o no.

## HU05 · Carga y validación del sílabo (SCRUM-14)

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU05-01 | Sílabo válido (criterio 1) | 1. Arrastrar el PDF del sílabo oficial a la zona de carga (o hacer clic y elegirlo). 2. Pulsar «Validar Sílabo». | Se muestra el nombre y el tamaño del archivo. Tras validar aparece «¡Sílabo validado correctamente!» en verde y el botón «Generar Curso» queda habilitado. | | |
| HU05-02 | PDF que no es sílabo (criterio 2) | 1. Elegir el PDF que no es un sílabo. 2. Pulsar «Validar Sílabo». | Aparece «El archivo PDF no cuenta con las secciones ni la estructura propia de un sílabo oficial de ISIL.» en rojo y «Generar Curso» sigue deshabilitado. | | |
| HU05-03 | Formato no permitido (criterio 3) | 1. Elegir el documento Word o la imagen. 2. Pulsar «Validar Sílabo». | Aparece «Formato no permitido. Solo se aceptan archivos PDF.» y «Generar Curso» sigue deshabilitado. | | |
| HU05-04 | PDF falso (complementaria) | 1. Elegir el archivo de texto renombrado a `.pdf`. 2. Pulsar «Validar Sílabo». | Aparece «Formato no permitido. Solo se aceptan archivos PDF.» y «Generar Curso» sigue deshabilitado. | | |
| HU05-05 | Tamaño máximo (complementaria) | 1. Elegir un PDF de más de 5 MB. 2. Pulsar «Validar Sílabo». | Aparece «El archivo excede el tamaño máximo permitido de 5MB.» y «Generar Curso» sigue deshabilitado. | | |
| HU05-06 | Archivo de entre 1 MB y 5 MB (complementaria) | 1. Elegir un PDF de sílabo válido que pese entre 1 y 5 MB. 2. Pulsar «Validar Sílabo». | Se valida igual que uno pequeño. No se queda en «Validando sílabo...» ni falla en silencio. | | |
| HU05-07 | Cambiar de archivo (complementaria) | 1. Validar un sílabo válido. 2. Elegir otro archivo o pulsar la «X» junto al nombre. | Desaparece el mensaje de la validación anterior y «Generar Curso» vuelve a quedar deshabilitado. | | |
| HU05-08 | Quitar el archivo (complementaria) | Elegir un archivo y pulsar la «X» junto a su nombre. | La zona de carga queda vacía y «Validar Sílabo» se deshabilita. Se puede volver a elegir el mismo archivo. | | |
| HU05-09 | Sin archivo (complementaria) | Abrir `/cargar-silabo` sin elegir nada. | «Validar Sílabo» y «Generar Curso» están deshabilitados. | | |
| HU05-10 | Arrastrar y soltar (complementaria) | Arrastrar un PDF sobre la zona de carga y soltarlo. | Mientras se arrastra, la zona se resalta en azul. Al soltar se muestra el nombre y el tamaño. | | |
| HU05-11 | Sin sesión (complementaria) | En una ventana de incógnito, abrir `/cargar-silabo`. | Se redirige a «Iniciar sesión». | | |
| HU05-12 | Nada se guarda (complementaria) | Validar un sílabo válido y revisar http://127.0.0.1:4100/firestore. | No aparece ninguna colección `silabos` ni documentos nuevos: la HU05 solo valida. | | |
| HU05-13 | «Generar Curso» pendiente de la HU06 (complementaria) | Con un sílabo válido, pulsar «Generar Curso». | Aparece «La generación del curso todavía no está disponible. Llegará con la HU06.» y no se crea ningún curso. | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| HU05-UI-01 | Abrir `/cargar-silabo` en un móvil (375 px de ancho) | La zona de carga ocupa el ancho de la pantalla, el nombre largo de un archivo se corta con puntos suspensivos y no hay desplazamiento horizontal. | | |
| HU05-UI-02 | Abrir la misma pantalla en escritorio | La tarjeta queda centrada y los botones ocupan todo su ancho. | | |

## Evidencia preliminar del desarrollo

Capturas tomadas por el desarrollador (José More Valle) durante la implementación, en local. No sustituyen la ejecución de QA ni los resultados de las columnas anteriores. Los PDF usados en las capturas 02, 03 y 10 son sintéticos, armados con el texto de los marcadores; el validador también se probó aparte con un sílabo oficial real.

| Captura | Muestra |
|---|---|
| [01](capturas/HU05-01-estado-inicial.png) | Estado inicial, con los dos botones deshabilitados |
| [02](capturas/HU05-02-silabo-valido.png) | Sílabo válido y «Generar Curso» habilitado |
| [03](capturas/HU05-03-pdf-que-no-es-silabo.png) | PDF que no es sílabo |
| [04](capturas/HU05-04-formato-no-permitido-docx.png) | Formato no permitido (Word) |
| [05](capturas/HU05-05-pdf-falso-renombrado.png) | PDF falso |
| [06](capturas/HU05-06-generar-curso-pendiente-HU06.png) | «Generar Curso» pendiente de la HU06 |
| [07](capturas/HU05-07-archivo-elegido.png) | Archivo elegido, con nombre, tamaño y «X» |
| [08](capturas/HU05-08-arrastrando.png) | Arrastrando sobre la zona de carga |
| [09](capturas/HU05-09-archivo-arrastrado.png) | Archivo soltado |
| [10](capturas/HU05-10-excede-5mb.png) | Archivo de más de 5 MB |
