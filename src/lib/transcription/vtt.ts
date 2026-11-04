// Único servidor desde el que se descarga un VTT: el de Zoom de ISIL.
// Evita que el microservicio (o una respuesta alterada) nos haga pedir direcciones internas o ajenas.
const ALLOWED_VTT_HOST = "isil-pe.zoom.us";
const ALLOWED_VTT_PATH = "/rec/play/vtt";

export function isAllowedVttUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname === ALLOWED_VTT_HOST &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    url.pathname === ALLOWED_VTT_PATH
  );
}

// Una intervención del VTT es un bloque con una línea de tiempos «00:00:01.000 --> 00:00:04.000»
const CUE_TIMING_LINE = /^\s*(\d{1,2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{1,2}:)?\d{2}:\d{2}\.\d{3}/;

export function countCues(vtt: string): number {
  return vtt.split(/\r?\n/).filter((line) => CUE_TIMING_LINE.test(line)).length;
}
