import { Hono } from "hono";
import type { AppEnv } from "../..";
import { registerV2DriveRoutes } from "./drive";

const v2 = new Hono<AppEnv>();

registerV2DriveRoutes(v2);

export type V2App = typeof v2;

export default v2;
