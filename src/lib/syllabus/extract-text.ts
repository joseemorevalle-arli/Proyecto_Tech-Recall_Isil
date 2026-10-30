import "server-only";
import PDFParser from "pdf2json";

// Todo PDF empieza con esta marca. Sirve para rechazar un archivo renombrado a .pdf.
const PDF_SIGNATURE = "%PDF-";

export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.subarray(0, PDF_SIGNATURE.length).toString("latin1") === PDF_SIGNATURE;
}

// Devuelve el texto del PDF en memoria (no se escribe nada en disco). Falla si el PDF está dañado.
export function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // El segundo argumento (true) pide el texto plano que lee getRawTextContent()
    const parser = new PDFParser(null, true);
    parser.on("pdfParser_dataError", (err) => {
      reject(err instanceof Error ? err : err.parserError);
    });
    parser.on("pdfParser_dataReady", () => {
      resolve(parser.getRawTextContent());
    });
    parser.parseBuffer(buffer);
  });
}
