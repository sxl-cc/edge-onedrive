import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { createEdgeOnedriveApp } from "../src";
import { DbKvStorage } from "./db-kv";

dotenv.config({
  path: "../.env",
});

const port = Number(process.env.PORT ?? 5121);

const kv = new DbKvStorage({
  name: "edge_onedrive_kv",
});

await kv.initialize();

const app = createEdgeOnedriveApp({
  kv,
});

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`edge-onedrive-api running on http://localhost:${info.port}`);
  }
);
