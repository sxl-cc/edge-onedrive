import { Hono } from "hono";
import type { AppEnv } from "../..";
import { registerV1AuthRoutes } from "./auth";
import { registerV1DriveRoutes } from "./drive";

const v1 = new Hono<AppEnv>();

v1.get("/hello", (c) =>
  c.json({
    message: "Hello from edge-onedrive API",
  })
);

registerV1AuthRoutes(v1);
registerV1DriveRoutes(v1);

export type V1App = typeof v1;

export default v1;
