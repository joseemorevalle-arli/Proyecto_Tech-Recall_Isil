"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Estado de error de «Mis cursos» y del detalle del curso (por ejemplo, si Firestore no responde)
export default function CursosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // refresh() vuelve a pedir los datos al servidor y reset() vuelve a mostrar la página
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <Alert variant="destructive">
        <CircleAlert aria-hidden />
        <AlertTitle>No pudimos cargar tus cursos</AlertTitle>
        <AlertDescription>
          Revisa tu conexión e inténtalo de nuevo en unos segundos.
        </AlertDescription>
      </Alert>
      <Button
        variant="outline"
        size="lg"
        className="self-start"
        onClick={retry}
        disabled={pending}
      >
        <RotateCw aria-hidden />
        {pending ? "Reintentando…" : "Reintentar"}
      </Button>
    </section>
  );
}
