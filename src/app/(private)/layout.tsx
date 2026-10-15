import { requireSession } from "@/lib/auth/session";

// Layout de las páginas privadas. Verifica la sesión en la primera carga;
// como no se vuelve a ejecutar al navegar entre páginas, cada página llama también a requireSession().
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="min-h-svh">
      <header className="border-b border-border px-4 py-3">
        <p className="font-heading mx-auto max-w-4xl bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to bg-clip-text text-xl text-transparent">
          Recall ISIL
        </p>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
