import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión · Recall ISIL" };

export default async function IniciarSesionPage() {
  // Con una sesión válida (verificada, no solo la cookie) no tiene sentido volver a iniciar sesión
  if (await getSession()) redirect("/cursos");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          <h1>Iniciar sesión</h1>
        </CardTitle>
        <CardDescription>
          Ingresa para ver tus cursos, clases y resultados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?&nbsp;
        <Link
          href="/crear-cuenta"
          className="text-primary underline-offset-4 hover:underline"
        >
          Crear cuenta
        </Link>
      </CardFooter>
    </Card>
  );
}
