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
import { getAllowedEmailDomains } from "@/lib/auth/allowed-domains";
import { getSession } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta · Recall ISIL" };

// Se renderiza en cada petición para leer ALLOWED_EMAIL_DOMAINS del entorno actual
export const dynamic = "force-dynamic";

export default async function CrearCuentaPage() {
  // Con una sesión válida (verificada, no solo la cookie) se va directo a sus cursos
  if (await getSession()) redirect("/cursos");

  const domains = getAllowedEmailDomains();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          <h1>Crear cuenta</h1>
        </CardTitle>
        <CardDescription>
          Usa tu correo institucional para guardar tus cursos y clases en un
          solo lugar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm domains={domains} />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?&nbsp;
        <Link
          href="/iniciar-sesion"
          className="text-primary underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
