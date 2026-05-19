import { createEdgeOnedriveApp, type KeyValueStorage } from "api";

interface CloudflareKvNamespace {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

const app = createEdgeOnedriveApp({
  kv: (c) => {
    if ("KV" in c.env) {
      const kv = c.env.KV as CloudflareKvNamespace;

      return {
        get(key) {
          return kv.get(key);
        },
        set(key, value) {
          return kv.put(key, value);
        },
        delete(key) {
          return kv.delete(key);
        },
      } satisfies KeyValueStorage;
    }

    throw new Error("KV is not defined");
  },
});

export default app;
