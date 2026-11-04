import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getClassQuiz } from "@/lib/classes/queries";
import { getCourse } from "@/lib/courses/queries";
import { CourseNoAccess } from "../../../course-no-access";
import { GenerateQuizButton } from "./generate-quiz-button";
import { QuizRunner } from "./quiz-runner";

export const metadata: Metadata = { title: "Cuestionario · Recall ISIL" };

// Generar el cuestionario con la IA puede tardar; aplica a la acción de esta página
export const maxDuration = 120;

type CuestionarioPageProps = { params: Promise<{ courseId: string; classId: string }> };

// HU11: el cuestionario de una clase. Primero se comprueba el curso del estudiante y después la clase dentro de ese curso.
export default async function CuestionarioPage({ params }: CuestionarioPageProps) {
  const { courseId, classId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);
  if (!course) return <CourseNoAccess />;

  const found = await getClassQuiz(uid, course.id, classId);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href={`/cursos/${course.id}/clases/${classId}`}
        className={buttonVariants({ variant: "ghost", className: "self-start" })}
      >
        <ArrowLeft aria-hidden />
        Volver a la clase
      </Link>

      {found === null ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No encontramos esa clase. Puede que ya la hayas eliminado.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm text-muted-foreground">Cuestionario</p>
            <h1 className="font-heading text-2xl break-words">{found.name}</h1>
          </div>

          {found.quiz ? (
            <QuizRunner quiz={found.quiz} courseId={course.id} classId={classId} />
          ) : (
            <EmptyQuiz
              courseId={course.id}
              classId={classId}
              className={found.name}
              hasTranscript={found.transcript !== null}
            />
          )}
        </>
      )}
    </section>
  );
}

// Estado vacío: la clase todavía no tiene cuestionario
function EmptyQuiz({
  courseId,
  classId,
  className,
  hasTranscript,
}: {
  courseId: string;
  classId: string;
  className: string;
  hasTranscript: boolean;
}) {
  return (
    <Card className="border border-dashed border-border ring-0">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ListChecks className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg">Aún no tienes cuestionario</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasTranscript
              ? "Genera 10 preguntas con 3 alternativas a partir de la transcripción de esta clase."
              : "Esta clase todavía no tiene transcripción. Obtén la transcripción desde el curso y vuelve aquí."}
          </p>
        </div>
        {hasTranscript && <GenerateQuizButton courseId={courseId} classId={classId} className={className} />}
      </CardContent>
    </Card>
  );
}
