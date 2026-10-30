// HU05: un sílabo oficial de ISIL tiene que traer todos estos marcadores en su texto.
// Si falta uno solo, el PDF no se considera un sílabo.
const MARKERS: RegExp[] = [
  /ISIL/i,
  /metodolog[ií]a ISIL/i,
  /Presencial[\s\S]*Semipresencial[\s\S]*Remota[\s\S]*Semirremota[\s\S]*Virtual/i,
  /Sistema de evaluaci[oó]n/i,
  /ESQUEMA DE EVALUACI[OÓ]N/i,
];

// Los PDF suelen traer espacios y saltos de línea repetidos; se normalizan antes de buscar
export function isIsilSyllabus(text: string): boolean {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return false;
  return MARKERS.every((marker) => marker.test(clean));
}
