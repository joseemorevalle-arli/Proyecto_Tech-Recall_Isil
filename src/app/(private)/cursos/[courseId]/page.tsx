import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCourse } from "@/lib/courses/queries";
import { countSessions, type CourseUnit } from "@/lib/courses/schema";
import { plural } from "../utils";

export const metadata: Metadata = { title: "Curso · Recall ISIL" };

type CursoPageProps = { params: Promise<{ courseId: string }> };

// HU07: detalle de un curso con sus unidades y sesiones.
// El curso se busca solo dentro de users/{uid}: el de otro estudiante no se encuentra (escenario 3).
export default async function CursoPage({ params }: CursoPageProps) {
  const { courseId } = await params;
  const { uid } = await requireSession();
  const course = await getCourse(uid, courseId);

  if (!course) return <NoAccess />;

  return (
    <section className="flex flex-col gap-6">
      <BackToCourses />

      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl break-words">{course.name}</h1>
        <p className="text-sm text-muted-foreground">
          {plural(course.units.length, "unidad", "unidades")} ·{" "}
          {plural(countSessions(course), "sesión", "sesiones")}
        </p>
      </div>

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
    </section>
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

// Escenario 3 de la HU07: el enlace es de un curso que no está en la cuenta del estudiante
function NoAccess() {
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

function BackToCourses() {
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
