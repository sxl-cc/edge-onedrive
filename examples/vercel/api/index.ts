import { neon } from "@neondatabase/serverless";
import { createEdgeOnedriveApp } from "api";

//! do this so vercel can detect this file is the hono app entry point
export type { Context } from "hono";

interface KvRow {
  value: string;
}

const app = createEdgeOnedriveApp({
  kv: async () => {
    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined");
    }
    const sql = neon(DATABASE_URL || "");
    await sql`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    return {
      async get(key: string) {
        const data = await sql`
      SELECT value FROM kv_store WHERE key = ${key} LIMIT 1
    `;

        const row = data[0] as KvRow | undefined;
        if (!row) {
          return null;
        }

        return row.value;
      },
      async set(key: string, value: string) {
        await sql`
      INSERT INTO kv_store (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `;
      },
      async delete(key: string) {
        await sql`DELETE FROM kv_store WHERE key = ${key}`;
      },
    };
  },
});

export default app;
