// Pantalla «Subir sílabo» de la HU05 (src/app/(private)/cargar-silabo). Si cambia de ruta, se cambia solo aquí.
export const UPLOAD_SYLLABUS_PATH = "/cargar-silabo";

// "1 unidad", "3 unidades", "0 sesiones"
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
