import "server-only";
import { parseEmailDomains } from "./email-domain";

// Dominios permitidos para crear cuenta, leídos de ALLOWED_EMAIL_DOMAINS (lista separada por comas).
// Se lee en el servidor y se le pasa al formulario como prop, así no hace falta otra variable NEXT_PUBLIC_.
export function getAllowedEmailDomains(): string[] {
  return parseEmailDomains(process.env.ALLOWED_EMAIL_DOMAINS);
}
