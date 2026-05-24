import { type ConnectorOptions, createDatabase, type Database } from "db0";
import sqlite from "db0/connectors/node-sqlite";
import type { KeyValueStorage } from "../src/kv-storage";

export class DbKvStorage implements KeyValueStorage {
  private readonly db: Database;
  constructor(opts: ConnectorOptions["node-sqlite"]) {
    this.db = createDatabase(sqlite(opts));
  }

  initialize() {
    return this.db.sql`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
  }

  delete(key: string): Promise<void> {
    return this.db.sql`
      DELETE FROM kv_store WHERE key = ${key}
    `;
  }
  async get(key: string) {
    const { rows } = await this.db.sql`
      SELECT value FROM kv_store WHERE key = ${key} LIMIT 1
    `;
    if (!rows?.length) {
      return null;
    }
    return rows[0].value as string;
  }

  put(key: string, value: string): Promise<void> {
    return this.db.sql`
      INSERT INTO kv_store (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;
  }
}
