import { z } from "zod";
import { isAllowedEmailDomain } from "./email-domain";

// Mensajes de los criterios de aceptación (van exactamente así)
export const MESSAGES = {
  institutionalEmail: "Usa tu correo institucional de ISIL",
  emailAlreadyExists: "Este correo ya está registrado",
  invalidCredentials: "Correo o contraseña incorrectos",
} as const;

export const PASSWORD_MIN_LENGTH = 8;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo")
  .pipe(z.email("Ingresa un correo válido"));

// El esquema recibe los dominios porque vienen de una variable de entorno del servidor
export function buildRegisterSchema(domains: string[]) {
  return z
    .object({
      email: emailField.refine(
        (email) => isAllowedEmailDomain(email, domains),
        MESSAGES.institutionalEmail,
      ),
      password: z
        .string()
        .min(
          PASSWORD_MIN_LENGTH,
          `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
        )
        .max(128, "La contraseña es demasiado larga"),
      confirmPassword: z.string().min(1, "Repite tu contraseña"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Las contraseñas no coinciden",
    });
}

export type RegisterInput = z.infer<ReturnType<typeof buildRegisterSchema>>;

// Inicio de sesión: no se valida el dominio para no dar pistas sobre qué correos existen
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Errores por campo, en el formato que muestra el formulario
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function firstErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
