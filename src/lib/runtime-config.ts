import { env } from "@/lib/env";

export type RuntimeConfig = {
  mode: "dev" | "demo" | "production";
  isDevelopment: boolean;
  isDemo: boolean;
  isProduction: boolean;
};

const mode = env.APP_ENV;

export const runtimeConfig: RuntimeConfig = {
  mode,
  isDevelopment: mode === "dev",
  isDemo: mode === "demo",
  isProduction: mode === "production",
};

