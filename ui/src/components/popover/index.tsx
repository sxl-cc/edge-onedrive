import "./popover.scss";
import {
  extraAriasAndDatasets,
  TinyFloating,
  TinyFloatingContent,
  TinyFloatingRoot,
  TinyFloatingTrigger,
} from "@solid-tiny-ui/core";
import { createMemo, type JSX } from "solid-js";
import { combineClass, combineStyle } from "solid-tiny-utils";

function Root(props: Parameters<typeof TinyFloating.Root>[0]) {
  return <TinyFloatingRoot {...props} />;
}

function Content(props: {
  children: JSX.Element;
  zIndex?: number | "auto";
  class?: string;
  style?: JSX.CSSProperties | string;
}) {
  const [floatingState] = TinyFloating.useContext();
  const transformOrigin = createMemo(() => {
    const placement = floatingState.placement;
    const map: Record<string, string> = {
      top: "bottom center",
      "top-start": "bottom left",
      "top-end": "bottom right",
      bottom: "top center",
      "bottom-start": "top left",
      "bottom-end": "top right",
      left: "center right",
      "left-start": "top right",
      "left-end": "bottom right",
      right: "center left",
      "right-start": "top left",
      "right-end": "bottom left",
    };
    return map[placement] || "center center";
  });

  const transformFrom = createMemo(() => {
    const placement = floatingState.placement;
    if (placement.startsWith("top")) {
      return "0, 8px";
    }
    if (placement.startsWith("bottom")) {
      return "0, -8px";
    }
    if (placement.startsWith("left")) {
      return "8px, 0";
    }
    if (placement.startsWith("right")) {
      return "-8px, 0";
    }
    return "0, 0";
  });

  return (
    <TinyFloatingContent
      {...extraAriasAndDatasets(props)}
      class={combineClass(
        "tiny-popover__content tiny-popover-vars",
        props.class
      )}
      style={combineStyle(
        {
          "--tiny-popover-transform-origin": transformOrigin(),
          "--tiny-popover-transform-from": transformFrom(),
        },
        props.style
      )}
      zIndex={props.zIndex}
    >
      {props.children}
    </TinyFloatingContent>
  );
}

export const Popover = {
  Content,
  Trigger: TinyFloatingTrigger,
  Root,
};
