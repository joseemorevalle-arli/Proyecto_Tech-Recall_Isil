// Pantalla «Subir sílabo» de la HU05. Si la HU05 usa otra ruta, se cambia solo aquí.
export const UPLOAD_SYLLABUS_PATH = "/subir-silabo";

// "1 unidad", "3 unidades", "0 sesiones"
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
