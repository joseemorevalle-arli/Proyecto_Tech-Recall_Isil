import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
  CircleCheck,
  ExternalLink,
  FileText,
  ListChecks,
  Pencil,
  Quote,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSession } from "@/lib/auth/session";
import { getClass, getClassContent } from "@/lib/classes/queries";
import { getCourse } from "@/lib/courses/queries";
import type { Summary } from "@/lib/summary/schema";
import { formatDateTime } from "../../../utils";
import { CourseNoAccess } from "../../course-no-access";
import { GenerateQuizButton } from "./cuestionario/generate-quiz-button";
import { GenerateSummaryButton } from "./generate-summary-button";
import { ManualTranscriptForm } from "./manual-transcript-form";
import { ProcessClassButton } from "./process-class-button";

export const metadata: Metadata = { title: "Clase · Recall ISIL" };

// Obtener la transcripción (HU09) y generar el resumen (HU10) o el cuestionario (HU11) puede tardar
export const maxDuration = 120;

type ClasePageProps = { params: Promise<{ courseId: string; classId: string }> };

// Detalle de una clase: grabación (HU13), transcripción (HU09 y HU17), resumen (HU10) y cuestionario (HU11).
// Primero se comprueba el curso del estudiante y después la clase dentro de ese curso.
export default async function ClasePage({ params }: ClasePageProps) {
  const { courseId, classId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);
  if (!course) return <CourseNoAccess />;

  const [found, content] = await Promise.all([
    getClass(uid, course.id, classId),
    getClassContent(uid, course.id, classId),
  ]);

  const back = (
    <Link href={`/cursos/${course.id}`} className={buttonVariants({ variant: "ghost", className: "self-start" })}>
      <ArrowLeft aria-hidden />
      Volver al curso
    </Link>
  );

  if (!found || !content) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {back}
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No encontramos esa clase. Puede que ya la hayas eliminado.
          </CardContent>
        </Card>
      </section>
    );
  }

  const hasTranscript = content.transcript !== null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm break-words text-muted-foreground">{course.name}</p>
          <h1 className="font-heading text-2xl break-words">{found.name}</h1>
          <p className="text-xs text-muted-foreground">
            Registrada el <time dateTime={found.createdAt.toISOString()}>{formatDateTime(found.createdAt)}</time>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* HU13: la grabación original se abre en una pestaña nueva, sin dar acceso a esta página */}
          <a
            href={found.zoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            <ExternalLink aria-hidden />
            Ver grabación
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
          <Link
            href={`/cursos/${course.id}/clases/${found.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Pencil aria-hidden />
            Editar
          </Link>
        </div>
      </div>

      {/* Transcripción: desde Zoom (HU09) o subida a mano (HU17) */}
      <Card id="transcripcion">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" aria-hidden />
            Transcripción
          </CardTitle>
          {!hasTranscript && (
            <CardDescription>
              El resumen y el cuestionario se generan a partir de la transcripción de la clase.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasTranscript ? (
            <p className="flex items-center gap-2 text-sm text-green-400">
              <CircleCheck className="size-4" aria-hidden />
              Transcripción lista
              <span className="text-muted-foreground">
                · {found.transcriptSource === "manual" ? "subida por ti" : "obtenida de Zoom"}
              </span>
            </p>
          ) : (
            <>
              <ProcessClassButton courseId={course.id} classId={found.id} className={found.name} transcribed={false} />
              <Separator />
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium">¿No se pudo obtener desde Zoom?</h3>
                <p className="text-sm text-muted-foreground">
                  Sube tú mismo la transcripción en un archivo .vtt (los subtítulos que descargas de Zoom) o .txt.
                </p>
              </div>
              <ManualTranscriptForm courseId={course.id} classId={found.id} />
            </>
          )}
        </CardContent>
      </Card>

      {/* HU10: resumen por temas */}
      <Card id="resumen">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpenText className="size-4" aria-hidden />
            Resumen por temas
          </CardTitle>
          {content.summary && (
            <CardDescription>
              {found.summaryGeneratedAt
                ? `Generado el ${formatDateTime(found.summaryGeneratedAt)} a partir de la transcripción.`
                : "Generado a partir de la transcripción."}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {content.summary ? (
            <SummaryTopics summary={content.summary} />
          ) : (
            <EmptySection
              title="Aún no tienes resumen"
              text={
                hasTranscript
                  ? "Genera un resumen con los temas de la clase y sus ideas clave para repasarla en minutos."
                  : "Primero obtén o sube la transcripción de esta clase."
              }
            >
              {hasTranscript && <GenerateSummaryButton courseId={course.id} classId={found.id} className={found.name} />}
            </EmptySection>
          )}
        </CardContent>
      </Card>

      {/* HU11: cuestionario */}
      <Card id="cuestionario">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4" aria-hidden />
            Cuestionario
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content.quiz ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                10 preguntas con 3 alternativas. Cada vez que lo resuelves se guarda en «Mi historial».
              </p>
              <Link
                href={`/cursos/${course.id}/clases/${found.id}/cuestionario`}
                className={buttonVariants({ variant: "outline" })}
              >
                <ListChecks aria-hidden />
                Resolver cuestionario
              </Link>
            </div>
          ) : hasTranscript ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Genera 10 preguntas con 3 alternativas a partir de la transcripción de esta clase.
              </p>
              <GenerateQuizButton courseId={course.id} classId={found.id} className={found.name} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Primero obtén o sube la transcripción de esta clase.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// HU10, escenario 1: los temas de la clase, cada uno con sus ideas clave.
// Escenario 2: cada tema muestra la frase de la clase donde se dictó.
function SummaryTopics({ summary }: { summary: Summary }) {
  return (
    <ol className="flex flex-col gap-5">
      {summary.topics.map((topic, i) => (
        <li key={i} className="flex flex-col gap-2">
          <h3 className="font-heading text-base break-words">
            {i + 1}. {topic.title}
          </h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {topic.keyIdeas.map((idea, j) => (
              <li key={j} className="break-words">
                {idea}
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 border-l-2 border-border pl-3 text-xs break-words text-muted-foreground italic">
            <Quote className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">En clase se dijo: </span>«{topic.evidence}»
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}

function EmptySection({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}
