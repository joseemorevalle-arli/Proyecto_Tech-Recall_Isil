import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { isEmailVerified } from "@/lib/auth/verification";
import { EmailVerificationBanner } from "./email-verification-banner";

// Layout de las páginas privadas. Verifica la sesión en la primera carga;
// como no se vuelve a ejecutar al navegar entre páginas, cada página llama también a requireSession().
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { uid, email } = await requireSession();

  // HU04: si no se puede consultar, no se muestra el aviso; las acciones de generación igual lo comprueban
  const verified = await isEmailVerified(uid).catch(() => true);

  return (
    <div className="min-h-svh">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* El logo lleva a «Mis cursos» desde cualquier página privada */}
          <Link
            href="/cursos"
            className="font-heading bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to bg-clip-text text-xl text-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Recall ISIL
          </Link>
          <nav aria-label="Principal" className="flex gap-4 text-sm">
            <Link href="/cursos" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Mis cursos
            </Link>
            {/* HU14 */}
            <Link href="/historial" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Mi historial
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        {!verified && <EmailVerificationBanner email={email} />}
        <div>{children}</div>
      </main>
    </div>
  );
}
