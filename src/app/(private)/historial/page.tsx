import type { Metadata } from "next";
import Link from "next/link";
import { History, ListChecks } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { listCourses } from "@/lib/courses/queries";
import { listAttempts } from "@/lib/quiz/attempt-queries";
import { groupAttemptsByCourse, type CourseHistory } from "@/lib/quiz/attempts";
import { formatDateTime, plural } from "../cursos/utils";

export const metadata: Metadata = { title: "Mi historial · Recall ISIL" };

// HU14: historial de cuestionarios y puntajes. Solo lee users/{uid} con el uid de la sesión.
export default async function HistorialPage() {
  const { uid } = await requireSession();
  const [attempts, courses] = await Promise.all([listAttempts(uid), listCourses(uid)]);
  const history = groupAttemptsByCourse(attempts, new Map(courses.map((course) => [course.id, course.name])));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl">Mi historial</h1>
        <p className="text-sm text-muted-foreground">Tus cuestionarios resueltos y sus puntajes, por curso.</p>
      </div>

      {history.length === 0 ? (
        <EmptyHistory />
      ) : (
        <ul className="flex flex-col gap-4">
          {history.map((course) => (
            <li key={course.courseId}>
              <CourseAttempts course={course} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Escenario 1: por curso, la clase, la fecha y el puntaje de cada intento
function CourseAttempts({ course }: { course: CourseHistory }) {
  const best = Math.max(...course.attempts.map((attempt) => attempt.score));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg break-words">
          <Link href={`/cursos/${course.courseId}`} className="underline-offset-4 hover:underline">
            {course.courseName}
          </Link>
        </CardTitle>
        <CardDescription>
          {plural(course.attempts.length, "intento", "intentos")} · mejor puntaje {best} de 10
        </CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <caption className="sr-only">Intentos de {course.courseName}</caption>
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="pb-2 font-normal">Clase</th>
              <th scope="col" className="hidden pb-2 font-normal sm:table-cell">Fecha</th>
              <th scope="col" className="pb-2 text-right font-normal">Puntaje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {course.attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td className="py-2 pr-3 align-top">
                  <Link
                    href={`/cursos/${attempt.courseId}/clases/${attempt.classId}`}
                    className="break-words underline-offset-4 hover:underline"
                  >
                    {attempt.className}
                  </Link>
                  {/* En el celular la fecha va debajo de la clase */}
                  <time dateTime={attempt.createdAt.toISOString()} className="block text-xs text-muted-foreground sm:hidden">
                    {formatDateTime(attempt.createdAt)}
                  </time>
                </td>
                <td className="hidden py-2 pr-3 align-top whitespace-nowrap text-muted-foreground sm:table-cell">
                  <time dateTime={attempt.createdAt.toISOString()}>{formatDateTime(attempt.createdAt)}</time>
                </td>
                <td className="py-2 text-right align-top font-medium whitespace-nowrap">
                  {attempt.score} de {attempt.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// Escenario 3: sin intentos, se explica cómo empezar
function EmptyHistory() {
  return (
    <Card className="border border-dashed border-border ring-0">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <History className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg">Aún no resuelves cuestionarios</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Para empezar, abre uno de tus cursos, elige una clase con transcripción y genera su cuestionario. Cada vez
            que lo resuelvas, tu puntaje aparecerá aquí.
          </p>
        </div>
        <Link href="/cursos" className={buttonVariants({ size: "lg" })}>
          <ListChecks aria-hidden />
          Ir a mis cursos
        </Link>
      </CardContent>
    </Card>
  );
}
