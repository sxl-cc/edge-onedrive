import type { Context } from "hono";

export function success(c: Context) {
  return c.body(null, 204);
}
