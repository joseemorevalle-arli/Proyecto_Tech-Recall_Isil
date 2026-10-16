import { Skeleton } from "@/components/ui/skeleton";

// Estado de carga del formulario «Registrar clase» mientras se busca el curso
export default function NuevaClaseLoading() {
  return (
    <section
      className="mx-auto flex w-full max-w-lg flex-col gap-6"
      aria-busy="true"
    >
      <span className="sr-only">Cargando el formulario…</span>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-96 rounded-xl" />
    </section>
  );
}
