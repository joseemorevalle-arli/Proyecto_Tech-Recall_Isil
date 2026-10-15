// Validación del dominio del correo. Es código puro: lo usan el formulario (navegador) y el servidor.

export function parseEmailDomains(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function isAllowedEmailDomain(email: string, domains: string[]): boolean {
  const domain = email.trim().toLowerCase().split("@").pop();
  return Boolean(domain) && domains.includes(domain!);
}
