import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin usa módulos nativos de Node: no se empaqueta, se carga tal cual en el servidor
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
