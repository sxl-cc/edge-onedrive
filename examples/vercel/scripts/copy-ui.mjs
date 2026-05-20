import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const uiDistDir = resolve(projectRoot, "../../ui/dist");
const publicDir = resolve(projectRoot, "public");

console.log(`Copying ${uiDistDir} to ${publicDir}`);

await rm(publicDir, { force: true, recursive: true });
await mkdir(publicDir, { recursive: true });
await cp(uiDistDir, publicDir, { recursive: true });

console.log("Done");
