import { presetTinyUi } from "@solid-tiny-ui/unocss-preset";
import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  rules: [
    [
      "scrollbar",
      {
        "scrollbar-width": "thin",
        "scrollbar-color": "rgb(var(--tiny-rgb-neutral-3) / 0.5) transparent",
        "scrollbar-gutter": "stable",
      },
    ],
  ],
  presets: [
    presetWind3({
      preflight: false,
    }),
    presetTinyUi(),
    presetIcons({
      scale: 1.18,
    }),
  ],
});
