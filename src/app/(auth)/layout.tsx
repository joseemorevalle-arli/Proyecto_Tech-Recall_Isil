// Layout de las pantallas públicas de autenticación: tarjeta centrada, pensada primero para móvil
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <p className="font-heading bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to bg-clip-text text-3xl text-transparent">
        Recall ISIL
      </p>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
