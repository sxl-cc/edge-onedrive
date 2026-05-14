import path from "node:path";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import solidPagesPlugin from "vite-plugin-solid-pages";

export default defineConfig({
  resolve: {
    alias: {
      "~/": `${path.resolve(path.dirname(""), "./src")}/`,
    },
  },
  css: {
    modules: false,
  },
  server: {
    port: 5122,
    proxy: {
      "/api": "http://localhost:5121",
    },
  },
  plugins: [
    UnoCSS(),
    solidPlugin(),
    solidPagesPlugin({
      dir: "./src/pages",
      extensions: ["tsx"],
    }),
  ],
});
