import { createEdgeOnedriveApp } from "api";
import type { EventContext, KVNamespace } from "../common/types";

declare const KV: KVNamespace;

const app = createEdgeOnedriveApp({
  kv: () => ({
    get(key) {
      return KV.get(key);
    },
    set(key, value) {
      return KV.put(key, value);
    },
    delete(key) {
      return KV.delete(key);
    },
  }),
});

function req(context: EventContext): Response | Promise<Response> {
  return app.fetch(context.request, context.env);
}

export const onRequestGet = req;
export const onRequestPost = req;
export const onRequestPut = req;
export const onRequestDelete = req;
export const onRequestOptions = req;
