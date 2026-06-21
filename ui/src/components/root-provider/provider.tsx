import "./global.scss";
import type { JSX } from "solid-js";
import { createWatch, mountStyle } from "solid-tiny-utils";
import { context } from "./context";
import {
  genColorStyles,
  genStatusColors,
  getBrandColors,
  getNeutralColors,
} from "./gen-colors";

export function RootProvider(props: { children?: JSX.Element; hue?: number }) {
  const Context = context.initial({
    hue: () => props.hue,
  });
  mountStyle(genColorStyles(genStatusColors()), "tiny-c-status");

  const [state] = Context.value;

  createWatch(
    () => [state.hue] as const,
    ([hue]) => {
      mountStyle(
        genColorStyles(getBrandColors(hue)) +
          genColorStyles(getNeutralColors(hue)),
        "tiny-c-theme",
        true
      );
    }
  );

  return <Context.Provider>{props.children}</Context.Provider>;
}

export function Color(props: { children?: JSX.Element; hue: number }) {
  return (
    <div data-hue={props.hue}>
      <style>
        {genColorStyles(getBrandColors(props.hue), `[data-hue="${props.hue}"]`)}
      </style>
      {props.children}
    </div>
  );
}
