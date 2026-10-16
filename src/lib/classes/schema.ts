import { z } from "zod";

// Formato del enlace de grabación que acepta la HU08 (criterio 1)
export const ZOOM_RECORDING_PREFIX = "https://isil-pe.zoom.us/rec/play/";

// El prefijo, el código de la grabación (letras, números, -, _ o .) y, si los hay, parámetros (?...).
// El código no admite "/" ni "%": así el enlace no puede salirse de /rec/play/ (por ejemplo, con ../).
const ZOOM_RECORDING_URL =
  /^https:\/\/isil-pe\.zoom\.us\/rec\/play\/[\w-][\w.-]*(\?\S*)?$/;

export const CLASS_NAME_MAX_LENGTH = 120;
const ZOOM_URL_MAX_LENGTH = 2048;

export const CLASS_MESSAGES = {
  nameRequired: "Escribe el nombre de la clase",
  nameTooLong: `El nombre puede tener hasta ${CLASS_NAME_MAX_LENGTH} caracteres`,
  zoomUrlRequired: "Pega el enlace de la grabación de Zoom",
  zoomUrlInvalid: `El enlace debe tener el formato ${ZOOM_RECORDING_PREFIX}...`,
  noAccess: "No tienes acceso a este curso",
} as const;

// Lo usan el formulario (validación mientras se escribe) y la Server Action (validación antes de guardar)
export const classSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, CLASS_MESSAGES.nameRequired)
    .max(CLASS_NAME_MAX_LENGTH, CLASS_MESSAGES.nameTooLong),
  zoomUrl: z
    .string()
    .trim()
    .min(1, CLASS_MESSAGES.zoomUrlRequired)
    .max(ZOOM_URL_MAX_LENGTH, CLASS_MESSAGES.zoomUrlInvalid)
    .regex(ZOOM_RECORDING_URL, CLASS_MESSAGES.zoomUrlInvalid),
});

export type ClassInput = z.infer<typeof classSchema>;
