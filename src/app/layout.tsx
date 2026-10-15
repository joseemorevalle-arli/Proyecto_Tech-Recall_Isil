import type { Metadata } from "next";
import { Archivo_Black, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Tipografías de la guía de estilos (Tabla 9 del informe)
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recall ISIL",
  description:
    "Asistente de IA para el Rendimiento Efectivo en el Aprendizaje de ISIL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Tema oscuro por defecto; las variables de fuente van en <html> porque ahí se aplica font-sans
    <html
      lang="es"
      className={`dark ${archivoBlack.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
