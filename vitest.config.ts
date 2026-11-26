import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    // Carga .env (incluida TEST_DATABASE_URL) en process.env para los tests.
    env: loadEnv(mode, process.cwd(), ""),
    // Los tests de integración comparten una base de datos: los corremos en serie.
    fileParallelism: false,
  },
}));
