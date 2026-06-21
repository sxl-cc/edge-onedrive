import "./tooltip.scss";
import { TinyFloating } from "@solid-tiny-ui/core";
import type { JSX } from "solid-js";

export interface TooltipProps {
  children: JSX.Element;
  content: string;
  disabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
  zIndex?: number | "auto";
}
export function Tooltip(props: TooltipProps) {
  return (
    <TinyFloating.Root
      disabled={props.disabled}
      placement={props.placement ?? "top"}
      trigger="hover"
    >
      <TinyFloating.Trigger>{props.children}</TinyFloating.Trigger>
      <TinyFloating.Content class="tiny-tooltip__content" zIndex={props.zIndex}>
        {props.content}
      </TinyFloating.Content>
    </TinyFloating.Root>
  );
}
