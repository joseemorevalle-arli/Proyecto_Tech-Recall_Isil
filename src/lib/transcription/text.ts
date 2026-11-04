// Línea de tiempos de una intervención: «00:04:55.780 --> 00:04:57.760»
const TIMING_LINE = /^\s*(\d{1,2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+/;

// Nombre de quien habla al inicio de la línea: «MARIO ANTONIO HUAPALLA MORALES: ». Zoom lo escribe
// siempre como «Nombre Apellido: » y va sin dos puntos antes dentro del nombre. Se acepta hasta 6 palabras
// para no recortar frases como «una duda: ...», que empiezan con una sola palabra en minúscula.
const SPEAKER_PREFIX = /^(?:\p{Lu}[\p{L}'.-]*\s+){0,5}\p{Lu}[\p{L}'.-]*:\s+/u;

// Convierte un VTT en el texto de lo que se dijo: sin encabezado, numeración, tiempos ni nombres de quien habla.
// Una intervención por línea. Los nombres se quitan porque no son contenido de la clase y así el
// cuestionario no hace preguntas sobre quién habló (HU11: «basadas solo en la transcripción»).
export function vttToPlainText(vtt: string): string {
  const lines: string[] = [];
  const blocks = vtt.split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const rows = block.split(/\r?\n/);
    const timing = rows.findIndex((row) => TIMING_LINE.test(row));
    if (timing === -1) continue; // encabezado WEBVTT u otro bloque sin tiempos

    const spoken = rows
      .slice(timing + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "") // etiquetas de formato: <v Ana>, <b>, </b>
      .replace(SPEAKER_PREFIX, "")
      .replace(/\s+/g, " ")
      .trim();
    if (spoken) lines.push(spoken);
  }

  return lines.join("\n");
}

// HU17: la transcripción puede venir de Zoom (VTT) o subirla el estudiante (VTT o TXT).
// Si el texto tiene líneas de tiempos se trata como VTT; si no, es texto plano y solo se limpian los espacios.
export function transcriptToPlainText(transcript: string): string {
  if (transcript.split(/\r?\n/).some((row) => TIMING_LINE.test(row))) return vttToPlainText(transcript);

  return transcript
    .split(/\r?\n/)
    .map((row) => row.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
