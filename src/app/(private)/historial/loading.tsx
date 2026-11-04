import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga de «Mi historial»
export default function HistorialLoading() {
  return (
    <section className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Cargando tu historial…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </section>
  );
}
