import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCourse } from "@/lib/courses/queries";
import { CourseNoAccess } from "../../course-no-access";
import { ClassForm } from "./class-form";

export const metadata: Metadata = { title: "Registrar clase · Recall ISIL" };

type NuevaClasePageProps = { params: Promise<{ courseId: string }> };

// HU08: registro de una clase con el enlace de su grabación de Zoom.
// El curso se busca solo dentro de users/{uid}: si no es del estudiante, no se muestra el formulario.
export default async function NuevaClasePage({ params }: NuevaClasePageProps) {
  const { courseId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);

  if (!course) return <CourseNoAccess />;

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <Link
        href={`/cursos/${course.id}`}
        className={buttonVariants({ variant: "ghost", className: "self-start" })}
      >
        <ArrowLeft aria-hidden />
        Volver al curso
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            <h1>Registrar clase</h1>
          </CardTitle>
          <CardDescription className="break-words">
            Curso: {course.name}. Escribe el nombre de la clase y pega el enlace
            de su grabación de Zoom; te diremos al instante si es válido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassForm courseId={course.id} />
        </CardContent>
      </Card>
    </section>
  );
}
