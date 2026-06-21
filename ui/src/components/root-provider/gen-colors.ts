import { oklchToRgb } from "solid-tiny-utils";

type Light = number;
type Color = number;

const lightRamp: [Light, Color][] = [
  [96, 0.021], // 0 tint
  [91.5, 0.04], // 1 subtle
  [85, 0.09], // 2 bg accent
  [79, 0.13], // 3 soft
  [73, 0.17], // 4 pre-primary
  [64, 0.22], // 5 ← PRIMARY
  [55, 0.21], // 6 active
  [48, 0.19], // 7 strong
  [36, 0.16], // 8 emphasis
  [28, 0.13], // 9 deep
];

const darkRamp: [Light, Color][] = [
  [21, 0.03], // 0 deep tint
  [29, 0.06], // 1 subtle
  [37, 0.08], // 2 bg accent
  [44, 0.11], // 3 soft
  [51, 0.15], // 4 pre-primary
  [57, 0.19], // 5 ← PRIMARY
  [63, 0.16], // 6 active
  [71, 0.12], // 7 strong
  [79, 0.09], // 8 emphasis
  [88, 0.05], // 9 glow
];

const INFO_HUE = 220;
const SUCCESS_HUE = 140;
const WARNING_HUE = 48;
const DANGER_HUE = 25;

const lightStatusRamp: [Light, Color][] = [
  [47, 0.17], // fg
  [59, 0.21], // base
  [80, 0.09], // surface
];

const darkStatusRamp: [Light, Color][] = [
  [68, 0.16], // fg
  [54, 0.19], // base
  [36, 0.07], // surface
];

interface Colors {
  dark: Record<string, string>;
  light: Record<string, string>;
}

export function genStatusColors(): {
  dark: Record<string, string>;
  light: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  const statuses = [
    { name: "info", hue: INFO_HUE },
    { name: "success", hue: SUCCESS_HUE },
    { name: "warning", hue: WARNING_HUE },
    { name: "danger", hue: DANGER_HUE },
  ];

  const levels = ["fg", "base", "surface"];

  for (const status of statuses) {
    for (let i = 0; i < lightStatusRamp.length; i++) {
      const level = levels[i];
      const [l, c] = lightStatusRamp[i];
      const [lD, cD] = darkStatusRamp[i];
      const lightC = oklch2rgb(l, c || 0.16, status.hue);
      const darkC = oklch2rgb(lD, cD, status.hue);
      light[`${status.name}-${level}`] = lightC;
      dark[`${status.name}-${level}`] = darkC;
    }
  }

  return { light, dark };
}

export function getBrandColors(hue: number): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  return genPaletteByHue(hue, [lightRamp, darkRamp], "brand");
}

export function getNeutralColors(hue: number): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const neutralizeRamp = (ramp: [Light, Color][]) => {
    return ramp.map(([l, c]) => {
      // Reduce chroma for neutral colors
      const newC = c * 0.06;
      const newL = l + (c - newC) * 0.5; // Adjust lightness slightly
      return [newL, newC] as [Light, Color];
    });
  };

  return genPaletteByHue(
    hue,
    [neutralizeRamp(lightRamp), neutralizeRamp(darkRamp)],
    "neutral"
  );
}

/**
 * Generate a color palette based on a given hue and ramp.
 *
 * @param hue - The hue value for the color palette.
 * @param ramp - [lightRamp, darkRamp] defining lightness and chroma for light and dark themes.
 * @param name - The base name for the color palette.
 * @returns An object containing light and dark color palettes.
 */
export function genPaletteByHue(
  hue: number,
  ramp: [[Light, Color][], [Light, Color][]],
  name: string
): Colors {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (let i = 0; i < 10; i++) {
    const [l, c] = ramp[0][i];
    const [lD, cD] = ramp[1][i];
    const lightC = oklch2rgb(l, c, hue);
    const darkC = oklch2rgb(lD, cD, hue);
    light[`${name}-${i}`] = lightC;
    dark[`${name}-${i}`] = darkC;
  }

  return { light, dark };
}

export function genColorStyles(colors: Colors, sel?: string) {
  const selector = sel ? `${sel}, .light ${sel}` : ":root, .light";
  const darkSelector = sel ? `.dark ${sel}` : ".dark";
  let css = `${selector}{`;
  for (const [name, value] of Object.entries(colors.light)) {
    css += `--tiny-rgb-${name}:${value};`;
  }
  css += `}${darkSelector}{`;
  for (const [name, value] of Object.entries(colors.dark)) {
    css += `--tiny-rgb-${name}:${value};`;
  }
  css += "}";
  return css;
}

export function oklch2web(l: number, c: number, h: number, a?: number) {
  const { r, g, b } = oklchToRgb({ l: l / 100, c, h });
  if (a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export function oklch2rgb(l: number, c: number, h: number) {
  const { r, g, b } = oklchToRgb({ l: l / 100, c, h });

  return `${r} ${g} ${b}`;
}
