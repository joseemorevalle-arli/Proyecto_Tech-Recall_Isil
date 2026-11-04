import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga del detalle de la clase
export default function ClaseLoading() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6" aria-busy="true">
      <span className="sr-only">Cargando la clase…</span>
      <Skeleton className="h-8 w-36" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </section>
  );
}
