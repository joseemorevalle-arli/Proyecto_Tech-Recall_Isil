import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { LogoutButton } from "../logout-button";

export const metadata: Metadata = { title: "Mis cursos · Recall ISIL" };

// Página privada mínima para HU02 y HU03.
// TODO(HU07): reemplazar por la lista real de cursos del estudiante (leer users/{uid}/... con session.uid).
export default async function CursosPage() {
  const session = await requireSession();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl">Mis cursos</h1>
          <p className="text-sm text-muted-foreground">{session.email}</p>
        </div>
        <LogoutButton />
      </div>
    </section>
  );
}
