// Pantalla «Subir sílabo» de la HU05 (src/app/(private)/cargar-silabo). Si cambia de ruta, se cambia solo aquí.
export const UPLOAD_SYLLABUS_PATH = "/cargar-silabo";

// "1 unidad", "3 unidades", "0 sesiones"
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Fecha y hora de Lima, por ejemplo "15 oct. 2026, 19:20".
// La zona va fija porque el servidor que arma la página puede estar en otra.
const dateTimeFormat = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Lima",
});

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}
