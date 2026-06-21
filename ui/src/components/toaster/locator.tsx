import { createMemo } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { Flex } from "../layout";
import type { ToastPosition } from "./type";

export function ToasterLocator(props: {
  children: JSX.Element;
  position: ToastPosition;
}) {
  const inset = createMemo(() => {
    switch (props.position) {
      case "top-left":
        return { top: "0", left: "0" };
      case "top-center":
        return { top: "0", left: "50%", transform: "translateX(-50%)" };
      case "top-right":
        return { top: "0", right: "0" };
      case "bottom-left":
        return { bottom: "0", left: "0" };
      case "bottom-center":
        return { bottom: "0", left: "50%", transform: "translateX(-50%)" };
      case "bottom-right":
        return { bottom: "0", right: "0" };
      default:
        return {};
    }
  });

  const alignItems = createMemo(() => {
    const pos = props.position;
    if (pos.includes("left")) {
      return "flex-start";
    }
    if (pos.includes("center")) {
      return "center";
    }
    if (pos.includes("right")) {
      return "flex-end";
    }
    return;
  });
  return (
    <Flex
      align={alignItems()}
      reverse={props.position.startsWith("bottom")}
      style={{
        position: "absolute",
        width: "fit-content",
        ...inset(),
      }}
      vertical
    >
      {props.children}
    </Flex>
  );
}
