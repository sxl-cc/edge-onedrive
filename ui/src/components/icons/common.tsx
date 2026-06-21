import type { JSX } from "solid-js";
import { createMemo } from "solid-js";

export interface IconProps {
  size?: string;
  viewBoxSize?: number;
}

export function SvgWrapper(props: IconProps & { children: JSX.Element }) {
  const size = createMemo(() => props.viewBoxSize || 24);
  return (
    <svg
      aria-label="icon"
      height={props.size || "1.2em"}
      role="img"
      viewBox={`0 0 ${size()} ${size()}`}
      width={props.size || "1.2em"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {props.children}
    </svg>
  );
}
