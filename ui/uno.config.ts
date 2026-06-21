import { defineConfig, presetIcons, presetWind3 } from "unocss";
import { presetTinyUi } from "./src/components/unocss-preset/tiny-ui-unocss-preset";

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
