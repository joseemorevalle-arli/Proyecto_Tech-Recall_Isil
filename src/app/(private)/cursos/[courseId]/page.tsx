import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, CircleCheck, ListChecks, Pencil, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { listClasses, type CourseClass } from "@/lib/classes/queries";
import { getCourse } from "@/lib/courses/queries";
import { countSessions, type CourseUnit } from "@/lib/courses/schema";
import { formatDateTime, plural } from "../utils";
import { BackToCourses, CourseNoAccess } from "./course-no-access";
import { DeleteClassButton } from "./clases/[classId]/delete-class-button";
import { GenerateQuizButton } from "./clases/[classId]/cuestionario/generate-quiz-button";
import { ProcessClassButton } from "./clases/[classId]/process-class-button";
import { DeleteCourseButton } from "./delete-course-button";

export const metadata: Metadata = { title: "Curso · Recall ISIL" };

// HU09: obtener la transcripción puede tardar (arranque en frío del servicio); aplica a la acción de esta página
export const maxDuration = 120;

type CursoPageProps = {
  params: Promise<{ courseId: string }>;
  // ?registrada={classId}: la clase que se acaba de registrar (HU08)
  // ?editado=1: el curso se acaba de editar. ?clase-editada={id} y ?clase-eliminada=1: CRUD de clases
  searchParams: Promise<{
    registrada?: string | string[];
    editado?: string | string[];
    "clase-editada"?: string | string[];
    "clase-eliminada"?: string | string[];
  }>;
};

// HU07: detalle de un curso con sus unidades y sesiones. HU08: sus clases registradas.
// El curso se busca solo dentro de users/{uid}: el de otro estudiante no se encuentra (escenario 3).
export default async function CursoPage({
  params,
  searchParams,
}: CursoPageProps) {
  const { courseId } = await params;
  const { registrada, editado, "clase-eliminada": claseEliminada } = await searchParams;
  const claseEditada = (await searchParams)["clase-editada"];
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);

  if (!course) return <CourseNoAccess />;

  const classes = await listClasses(uid, course.id);
  const registeredClass = classes.find((item) => item.id === registrada);

  return (
    <section className="flex flex-col gap-6">
      <BackToCourses />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-2xl break-words">{course.name}</h1>
          <p className="text-sm text-muted-foreground">
            {plural(course.units.length, "unidad", "unidades")} ·{" "}
            {plural(countSessions(course), "sesión", "sesiones")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cursos/${course.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Pencil aria-hidden />
            Editar curso
          </Link>
          {/* Sin clases, el botón aparece en el estado vacío */}
          {classes.length > 0 && <RegisterClassLink courseId={course.id} />}
          <DeleteCourseButton
            courseId={course.id}
            courseName={course.name}
            classCount={classes.length}
          />
        </div>
      </div>

      {claseEliminada === "1" && (
        <Alert className="text-green-400">
          <CircleCheck aria-hidden />
          <AlertTitle>Clase eliminada</AlertTitle>
          <AlertDescription>La clase se borró del curso.</AlertDescription>
        </Alert>
      )}

      {typeof claseEditada === "string" && classes.some((item) => item.id === claseEditada) && (
        <Alert className="text-green-400">
          <CircleCheck aria-hidden />
          <AlertTitle>Clase actualizada</AlertTitle>
          <AlertDescription>Los cambios de la clase se guardaron.</AlertDescription>
        </Alert>
      )}

      {editado === "1" && (
        <Alert className="text-green-400">
          <CircleCheck aria-hidden />
          <AlertTitle>Curso actualizado</AlertTitle>
          <AlertDescription>Los cambios se guardaron.</AlertDescription>
        </Alert>
      )}

      {registeredClass && (
        <Alert className="text-green-400">
          <CircleCheck aria-hidden />
          <AlertTitle>Clase registrada</AlertTitle>
          <AlertDescription className="break-words">
            «{registeredClass.name}» ya está en la lista de clases del curso.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Clases registradas</h2>
        {classes.length === 0 ? (
          <EmptyClasses courseId={course.id} />
        ) : (
          <ClassList classes={classes} courseId={course.id} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Unidades y sesiones</h2>
        {course.units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este curso todavía no tiene unidades.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {course.units.map((unit) => (
              <li key={unit.number}>
                <UnitCard unit={unit} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

// HU08: lleva al formulario para registrar una clase con su enlace de Zoom
function RegisterClassLink({ courseId }: { courseId: string }) {
  return (
    <Link
      href={`/cursos/${courseId}/clases/nueva`}
      className={buttonVariants({ size: "lg" })}
    >
      <Video aria-hidden />
      Registrar clase
    </Link>
  );
}

// Clases del curso, de la más reciente a la más antigua
function ClassList({ classes, courseId }: { classes: CourseClass[]; courseId: string }) {
  return (
    <Card>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {classes.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Video
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  {/* HU10/HU13/HU17: el detalle de la clase tiene la grabación, el resumen y la carga manual */}
                  <Link
                    href={`/cursos/${courseId}/clases/${item.id}`}
                    className="font-medium break-words underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {item.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Registrada el{" "}
                    <time dateTime={item.createdAt.toISOString()}>
                      {formatDateTime(item.createdAt)}
                    </time>
                  </span>
                </div>
                {/* HU09: obtener la transcripción de la grabación */}
                <ProcessClassButton
                  courseId={courseId}
                  classId={item.id}
                  className={item.name}
                  transcribed={Boolean(item.transcribedAt)}
                  manualUploadHref={`/cursos/${courseId}/clases/${item.id}#transcripcion`}
                />
                {/* HU10: con transcripción, el resumen está en el detalle de la clase */}
                {item.transcribedAt && (
                  <Link
                    href={`/cursos/${courseId}/clases/${item.id}#resumen`}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
                  >
                    <BookOpenText aria-hidden />
                    {item.summaryGeneratedAt ? "Ver resumen" : "Generar resumen"}
                  </Link>
                )}
                {/* HU11: con transcripción, se genera o se resuelve el cuestionario */}
                {item.transcribedAt &&
                  (item.quizGeneratedAt ? (
                    <Link
                      href={`/cursos/${courseId}/clases/${item.id}/cuestionario`}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
                    >
                      <ListChecks aria-hidden />
                      Resolver cuestionario
                    </Link>
                  ) : (
                    <GenerateQuizButton courseId={courseId} classId={item.id} className={item.name} />
                  ))}
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/cursos/${courseId}/clases/${item.id}/editar`}
                  aria-label={`Editar la clase ${item.name}`}
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                >
                  <Pencil aria-hidden />
                </Link>
                <DeleteClassButton courseId={courseId} classId={item.id} className={item.name} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Estado vacío de la HU08: el curso todavía no tiene clases
function EmptyClasses({ courseId }: { courseId: string }) {
  return (
    <Card className="border border-dashed border-border ring-0">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Video className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg">Aún no registras clases</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Registra cada clase con el enlace de su grabación de Zoom. Aquí
            verás todas las clases de este curso.
          </p>
        </div>
        <RegisterClassLink courseId={courseId} />
      </CardContent>
    </Card>
  );
}

function UnitCard({ unit }: { unit: CourseUnit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base break-words">
          Unidad {unit.number}: {unit.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unit.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Esta unidad no tiene sesiones.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {unit.sessions.map((session) => (
              <li
                key={session.number}
                className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:gap-3"
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground sm:w-20 sm:pt-0.5">
                  Sesión {session.number}
                </span>
                <span className="break-words">{session.title}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
