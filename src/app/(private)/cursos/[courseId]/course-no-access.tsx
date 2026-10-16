import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

// Escenario 3 de la HU07: el enlace es de un curso que no está en la cuenta del estudiante.
// También lo muestra el formulario de la HU08 (/cursos/{courseId}/clases/nueva).
export function CourseNoAccess() {
  return (
    <section className="flex flex-col gap-6">
      <BackToCourses />
      <Alert variant="destructive">
        <ShieldAlert aria-hidden />
        <AlertTitle>No tienes acceso a este curso</AlertTitle>
        <AlertDescription>
          Solo puedes abrir los cursos registrados en tu cuenta.
        </AlertDescription>
      </Alert>
    </section>
  );
}

export function BackToCourses() {
  return (
    <Link
      href="/cursos"
      className={buttonVariants({ variant: "ghost", className: "self-start" })}
    >
      <ArrowLeft aria-hidden />
      Mis cursos
    </Link>
  );
}
