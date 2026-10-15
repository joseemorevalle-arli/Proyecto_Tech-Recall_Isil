# Recall ISIL

Asistente de IA para el Rendimiento Efectivo en el Aprendizaje de ISIL. Proyecto tecnológico académico colaborativo (curso Proyecto Tecnológico, ISIL, 2026-2) desarrollado con Scrum.

El estudiante sube el sílabo oficial en PDF, el sistema genera su curso con unidades y sesiones, registra cada clase con el enlace de su grabación de Zoom y, a partir de la transcripción, obtiene un resumen por temas y un cuestionario.

## Stack

- Next.js 15.5 (App Router, Server Actions), React 19 y TypeScript 5
- Tailwind CSS 4 y shadcn/ui
- Firebase Authentication y Cloud Firestore (`firebase-admin` en el servidor)
- Despliegue en Vercel: `experimental` = staging (preview), `main` = producción

> Se usa Next.js 15.5 y no 15.3 porque la rama 15.3 ya no recibe parches de seguridad (su último parche, 15.3.9, tiene vulnerabilidades críticas conocidas).

## Requisitos

- Node.js 20 o superior y npm

## Cómo levantar el proyecto

```bash
npm install
cp .env.example .env.local   # luego completa los valores
npm run dev
```

La aplicación queda en http://localhost:3000.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |

## Guía de estilos

Los colores, el radio de borde y las tipografías están definidos como tokens en `src/app/globals.css` según la guía de estilos del informe (tema oscuro por defecto, Archivo Black para títulos y Geist para el resto). Para cambiar un color se cambia el token, no el componente.

## Flujo de ramas

`feature/HUxx-descripcion` → PR a `experimental` → PR a `main`. Nada entra a `main` sin un PR aprobado por otro integrante. Los commits llevan la clave de Jira, por ejemplo `feat(HU02): formulario de registro [SCRUM-33]`.
