// We need this KeyValueStorage to persist tokens across sessions in the Edge extension environment
// It can be Sqlite, Postgres, Cloudflare KV, or even in-memory storage for testing purposes

export interface KeyValueStorage {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly store: Record<string, string> = {};

  delete(key: string): Promise<void> {
    delete this.store[key];
    return Promise.resolve();
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store[key] ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.store[key] = value;
    return Promise.resolve();
  }
}
