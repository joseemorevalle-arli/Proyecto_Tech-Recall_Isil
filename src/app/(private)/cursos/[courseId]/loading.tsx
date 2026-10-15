import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga del detalle del curso
export default function CursoLoading() {
  return (
    <section className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Cargando el curso…</span>
      <Skeleton className="h-8 w-28" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </section>
  );
}
