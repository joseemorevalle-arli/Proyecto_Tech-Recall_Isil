import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin usa módulos nativos de Node: no se empaqueta, se carga tal cual en el servidor
  serverExternalPackages: ["firebase-admin"],
  // HU05 acepta sílabos de hasta 5 MB; el límite por defecto de las Server Actions es 1 MB
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
