export interface EventContext {
  env: Record<string, string>;
  params: Record<string, string>;
  request: Request;
  waitUntil: (task: Promise<unknown>) => void;
}

export interface KVNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}
