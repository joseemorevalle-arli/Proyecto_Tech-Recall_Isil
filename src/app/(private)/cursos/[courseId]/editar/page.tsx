import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCourse } from "@/lib/courses/queries";
import { CourseNoAccess } from "../course-no-access";
import { CourseEditForm } from "./course-edit-form";

export const metadata: Metadata = { title: "Editar curso · Recall ISIL" };

type EditarCursoPageProps = { params: Promise<{ courseId: string }> };

// CRUD de cursos: edición del nombre, las unidades y las sesiones.
// El curso se busca solo dentro de users/{uid}: si no es del estudiante, no se muestra el formulario.
export default async function EditarCursoPage({ params }: EditarCursoPageProps) {
  const { courseId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);

  if (!course) return <CourseNoAccess />;

  // Al formulario solo viajan los títulos: los números se recalculan en el servidor al guardar
  const draft = {
    name: course.name,
    units: course.units.map((unit) => ({
      title: unit.title,
      sessions: unit.sessions.map((session) => ({ title: session.title })),
    })),
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
            <h1>Editar curso</h1>
          </CardTitle>
          <CardDescription>
            Corrige lo que haga falta: cambia títulos, agrega, quita o reordena unidades y
            sesiones. Las clases registradas no cambian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseEditForm courseId={course.id} course={draft} />
        </CardContent>
      </Card>
    </section>
  );
}
