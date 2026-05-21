import { Hono } from "hono";
import type { AppEnv } from "../..";
import { registerV1AuthRoutes } from "./auth";
import { registerV1DriveRoutes } from "./drive";
import { registerV1HealthRoutes } from "./health";

const v1 = new Hono<AppEnv>();

registerV1AuthRoutes(v1);
registerV1DriveRoutes(v1);
registerV1HealthRoutes(v1);

export type V1App = typeof v1;

export default v1;
