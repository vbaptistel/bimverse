import fs from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "db",
  "postgres",
  "host.docker.internal",
]);

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const output: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

function loadFileEnv(rootDir: string): Record<string, string> {
  const merged: Record<string, string> = {};

  for (const fileName of [".env", ".env.local", ".env.e2e", ".env.e2e.local"]) {
    Object.assign(merged, readEnvFile(path.join(rootDir, fileName)));
  }

  return merged;
}

function resolveEnv(key: string, fileEnv: Record<string, string>): string | undefined {
  return process.env[key] ?? fileEnv[key];
}

function getHostname(rawValue: string): string | null {
  try {
    return new URL(rawValue).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function validateIsLocalUrl(
  envName: string,
  envValue: string | undefined,
): string | null {
  if (!envValue) {
    return null;
  }

  const host = getHostname(envValue);
  if (!host) {
    return null;
  }

  if (LOCAL_HOSTS.has(host)) {
    return null;
  }

  return `${envName} -> ${host}`;
}

export default async function globalSetup(_config: FullConfig) {
  void _config;

  if (process.env.E2E_ALLOW_REMOTE_ENV === "1") {
    return;
  }

  const rootDir = process.cwd();
  const fileEnv = loadFileEnv(rootDir);

  const databaseUrl = resolveEnv("DATABASE_URL", fileEnv);
  const supabaseUrl = resolveEnv("NEXT_PUBLIC_SUPABASE_URL", fileEnv);
  const appUrl = resolveEnv("NEXT_PUBLIC_APP_URL", fileEnv);

  const issues = [
    validateIsLocalUrl("DATABASE_URL", databaseUrl),
    validateIsLocalUrl("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    validateIsLocalUrl("NEXT_PUBLIC_APP_URL", appUrl),
  ].filter((issue): issue is string => Boolean(issue));

  if (issues.length === 0) {
    return;
  }

  throw new Error(
    [
      "E2E safety guard bloqueou a execução porque variáveis apontam para host não local:",
      ...issues.map((issue) => `- ${issue}`),
      "Use ambiente local de testes (ex.: .env.e2e.local) ou defina E2E_ALLOW_REMOTE_ENV=1 explicitamente.",
    ].join("\n"),
  );
}
