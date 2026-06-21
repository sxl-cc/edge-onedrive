import type { OmitComponentProps } from "@solid-tiny-ui/core";
import {
  createMemo,
  type JSX,
  splitProps,
  type ValidComponent,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { combineStyle, isString } from "solid-tiny-utils";

export function Flex<T extends ValidComponent>(
  props: {
    children: JSX.Element;
    vertical?: boolean;
    reverse?: boolean;
    wrap?: boolean;
    justify?: JSX.CSSProperties["justify-content"];
    align?: JSX.CSSProperties["align-items"];
    gap?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | number;
    flex?: JSX.CSSProperties["flex"];
    as?: T;
    style?: JSX.CSSProperties | string;
    inline?: boolean;
  } & OmitComponentProps<T, "children">
) {
  const gap = createMemo(() => {
    const gapProp = props.gap || 0;
    if (isString(gapProp)) {
      return gapProp;
    }
    return `${gapProp}px`;
  });

  const [local, others] = splitProps(props, [
    "children",
    "vertical",
    "wrap",
    "justify",
    "align",
    "gap",
    "flex",
    "as",
    "style",
    "inline",
    "reverse",
  ]);
  return (
    <Dynamic
      {...others}
      component={props.as ?? "div"}
      style={combineStyle(
        {
          display: local.inline ? "inline-flex" : "flex",
          "flex-direction": local.vertical
            ? `column${local.reverse ? "-reverse" : ""}`
            : `row${local.reverse ? "-reverse" : ""}`,
          "flex-wrap": local.wrap ? "wrap" : "nowrap",
          "justify-content": local.justify,
          "align-items": local.align,
          gap: gap(),
          flex: local.flex,
        },
        local.style
      )}
    >
      {local.children}
    </Dynamic>
  );
}
