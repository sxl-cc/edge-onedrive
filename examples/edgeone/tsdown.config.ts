import { defineConfig } from "tsdown";

export default defineConfig({
  exports: false,
  platform: "node",
  format: "es",
  unbundle: false,
  outExtensions: () => ({
    js: ".js",
  }),
  entry: "src/node/index.ts",
  outputOptions: {
    file: "./dist/cloud-functions/api/[[default]].js",
  },
  dts: false,
  clean: true,
  copy: [
    "edgeone.json",
    {
      from: "../../ui/dist",
      to: ".",
    },
  ],
  deps: {
    alwaysBundle: ["api"],
  },
  // ...config options
});
