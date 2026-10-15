# Casos de prueba · Sprint 1 · HU02 y HU03

Proyecto Recall ISIL · Grupo 1. Las columnas **Resultado** y **Evidencia** las completa QA (Carlos León) al ejecutar las pruebas en staging.

- Entorno: _(pendiente: URL de staging)_
- Fecha de ejecución: _(pendiente)_
- Ejecutado por: _(pendiente)_
- Dominio permitido (`ALLOWED_EMAIL_DOMAINS`): _(pendiente: confirmar con el PO)_

## HU02 · Registro con correo institucional (SCRUM-12) · pruebas SCRUM-35

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU02-01 | Registro exitoso | 1. Abrir «Crear cuenta». 2. Ingresar un correo del dominio permitido que no tenga cuenta. 3. Ingresar una contraseña de 8 o más caracteres y repetirla. 4. Pulsar «Crear cuenta». | El botón muestra «Creando cuenta…» y se deshabilita. Se crea la cuenta y se abre «Mis cursos» con el correo del estudiante. | | |
| HU02-02 | Correo no institucional | 1. Abrir «Crear cuenta». 2. Ingresar un correo de otro dominio (por ejemplo, Gmail). 3. Completar la contraseña y repetirla. 4. Pulsar «Crear cuenta». | Se muestra «Usa tu correo institucional de ISIL», el correo escrito se mantiene y la cuenta no se crea. | | |
| HU02-03 | Correo ya registrado | 1. Abrir «Crear cuenta». 2. Ingresar un correo que ya tenga cuenta. 3. Completar la contraseña y repetirla. 4. Pulsar «Crear cuenta». | Se muestra «Este correo ya está registrado» con un enlace a «Iniciar sesión» que lleva a esa pantalla. | | |
| HU02-04 | Contraseña corta (complementaria) | Ingresar una contraseña de menos de 8 caracteres y pulsar «Crear cuenta». | Se muestra «La contraseña debe tener al menos 8 caracteres» y no se envía el formulario. | | |
| HU02-05 | Contraseñas distintas (complementaria) | Ingresar contraseñas diferentes en «Contraseña» y «Repite la contraseña». | Se muestra «Las contraseñas no coinciden». | | |

## HU03 · Inicio y cierre de sesión (SCRUM-13) · pruebas SCRUM-39

| ID | Escenario | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU03-01 | Inicio exitoso | 1. Abrir «Iniciar sesión». 2. Ingresar el correo y la contraseña de una cuenta existente. 3. Pulsar «Iniciar sesión». | El botón muestra «Ingresando…». Se abre «Mis cursos» con el correo del estudiante. | | |
| HU03-02 | Credenciales incorrectas | 1. Abrir «Iniciar sesión». 2. Ingresar un correo existente con una contraseña incorrecta. 3. Pulsar «Iniciar sesión». 4. Repetir con un correo que no tenga cuenta. | En ambos casos se muestra el mismo mensaje, «Correo o contraseña incorrectos», sin indicar cuál dato falló. El correo escrito se mantiene. | | |
| HU03-03 | Cierre de sesión | 1. Con la sesión iniciada, pulsar «Cerrar sesión» en «Mis cursos». 2. Escribir en la barra de direcciones la ruta `/cursos`. | Se vuelve a «Iniciar sesión». Al abrir `/cursos` se pide iniciar sesión de nuevo. | | |
| HU03-04 | Página privada sin sesión (complementaria) | En una ventana de incógnito, abrir `/cursos`. | Se redirige a «Iniciar sesión». | | |
| HU03-05 | Sesión activa en pantallas públicas (complementaria) | Con la sesión iniciada, abrir «Crear cuenta» o «Iniciar sesión». | Se redirige a «Mis cursos». | | |

## Responsive

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| UI-01 | Abrir las tres pantallas en un móvil (375 px de ancho) | Los formularios se ven completos, sin desplazamiento horizontal. | | |
| UI-02 | Abrir las tres pantallas en escritorio | La tarjeta queda centrada y los textos son legibles. | | |
