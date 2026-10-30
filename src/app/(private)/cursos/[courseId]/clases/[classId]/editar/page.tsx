import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getClass } from "@/lib/classes/queries";
import { getCourse } from "@/lib/courses/queries";
import { CourseNoAccess } from "../../../course-no-access";
import { ClassForm } from "../../nueva/class-form";
import { editClassAction } from "../actions";

export const metadata: Metadata = { title: "Editar clase · Recall ISIL" };

type EditarClasePageProps = { params: Promise<{ courseId: string; classId: string }> };

// CRUD de clases: edición del nombre y del enlace de Zoom.
// Primero se comprueba el curso del estudiante y después la clase dentro de ese curso.
export default async function EditarClasePage({ params }: EditarClasePageProps) {
  const { courseId, classId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);
  if (!course) return <CourseNoAccess />;

  const item = await getClass(uid, course.id, classId);

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
            <h1>Editar clase</h1>
          </CardTitle>
          <CardDescription className="break-words">
            {item
              ? `Curso: ${course.name}. Cambia el nombre o el enlace de la grabación de Zoom.`
              : "No encontramos esa clase. Puede que ya la hayas eliminado."}
          </CardDescription>
        </CardHeader>
        {item && (
          <CardContent>
            <ClassForm
              courseId={course.id}
              classId={item.id}
              action={editClassAction}
              initialName={item.name}
              initialZoomUrl={item.zoomUrl}
              submitLabel="Guardar cambios"
              pendingLabel="Guardando cambios…"
            />
          </CardContent>
        )}
      </Card>
    </section>
  );
}
