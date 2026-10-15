import { NextResponse, type NextRequest } from "next/server";

// Corre en Edge antes de cada petición a una ruta privada.
// Solo revisa que exista la cookie (no importa firebase-admin): la verificación real la hace requireSession().
const SESSION_COOKIE = "session"; // igual que en src/lib/auth/session.ts

export function middleware(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/iniciar-sesion", request.url));
  }
  return NextResponse.next();
}

// Rutas privadas. Las nuevas HU agregan aquí sus rutas (por ejemplo, "/clases/:path*").
export const config = {
  matcher: ["/cursos/:path*"],
};
