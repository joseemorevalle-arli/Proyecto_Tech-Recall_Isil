import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { listCourses } from "@/lib/courses/queries";
import { countSessions, type Course } from "@/lib/courses/schema";
import { LogoutButton } from "../logout-button";
import { UPLOAD_SYLLABUS_PATH, plural } from "./utils";

export const metadata: Metadata = { title: "Mis cursos · Recall ISIL" };

// HU07: lista de los cursos del estudiante. Solo lee users/{uid}/courses con el uid de la sesión.
export default async function CursosPage() {
  const session = await requireSession();
  const courses = await listCourses(session.uid);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl">Mis cursos</h1>
          <p className="text-sm text-muted-foreground">{session.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {courses.length > 0 && (
            <Link
              href={UPLOAD_SYLLABUS_PATH}
              className={buttonVariants({ size: "lg" })}
            >
              <FileUp aria-hidden />
              Subir sílabo
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyCourses />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  const units = course.units.length;
  const sessions = countSessions(course);

  return (
    <Link
      href={`/cursos/${course.id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover:bg-muted/60 group-hover:ring-primary/60">
        <CardHeader>
          <CardTitle className="text-lg break-words">{course.name}</CardTitle>
          <CardDescription>
            {plural(units, "unidad", "unidades")} ·{" "}
            {plural(sessions, "sesión", "sesiones")}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

// Escenario 2 de la HU07: sin cursos, se invita a empezar subiendo el sílabo
function EmptyCourses() {
  return (
    <Card className="border border-dashed border-border ring-0">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg">Aún no tienes cursos</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Empieza subiendo el sílabo oficial de tu curso en PDF y armaremos
            sus unidades y sesiones para que organices tu repaso.
          </p>
        </div>
        <Link
          href={UPLOAD_SYLLABUS_PATH}
          className={buttonVariants({ size: "lg" })}
        >
          <FileUp aria-hidden />
          Subir sílabo
        </Link>
      </CardContent>
    </Card>
  );
}
