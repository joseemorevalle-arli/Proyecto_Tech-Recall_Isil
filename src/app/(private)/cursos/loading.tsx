import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga de «Mis cursos» mientras se leen los cursos en el servidor
export default function CursosLoading() {
  return (
    <section className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Cargando tus cursos…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </section>
  );
}
