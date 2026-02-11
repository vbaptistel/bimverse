import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/shared/infrastructure/db/schema";
import { env } from "@/shared/infrastructure/env";

declare global {
  var __bimverseDb: ReturnType<typeof drizzle> | undefined;
}

function createDb() {
  const queryClient = postgres(env.databaseUrl(), {
    max: 1,
    prepare: false,
  });

  return drizzle(queryClient, { schema, casing: "snake_case" });
}

export const db = global.__bimverseDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  global.__bimverseDb = db;
}
