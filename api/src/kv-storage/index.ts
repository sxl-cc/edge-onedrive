// We need this KeyValueStorage to persist tokens across sessions in the Edge extension environment
// It can be Sqlite, Postgres, Cloudflare KV, or even in-memory storage for testing purposes

export interface KeyValueStorage {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}
