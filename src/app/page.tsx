import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

// Ruta raíz: envía a «Mis cursos» o a iniciar sesión. La HU01 (Sprint 4) la reemplazará por la página de inicio.
export default async function Home() {
  redirect((await getSession()) ? "/cursos" : "/iniciar-sesion");
}
