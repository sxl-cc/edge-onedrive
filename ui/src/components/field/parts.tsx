import "./field.scss";
import type { OmitComponentProps } from "@solid-tiny-ui/core";
import {
  type ComponentProps,
  createUniqueId,
  type JSX,
  Show,
  splitProps,
} from "solid-js";
import {
  callMaybeCallableChild,
  combineClass,
  type MaybeCallableChild,
} from "solid-tiny-utils";
import { Flex } from "../layout";

export function Root(
  props: {
    orientation?: "horizontal" | "vertical";
    children?: MaybeCallableChild<[{ uniqueId: string }]>;
  } & OmitComponentProps<typeof Flex, "vertical" | "children">
) {
  const [local, others] = splitProps(props, ["orientation", "children", "gap"]);
  return (
    <Flex
      {...others}
      gap={local.gap ?? "sm"}
      vertical={local.orientation !== "horizontal"}
    >
      {callMaybeCallableChild(local.children, {
        uniqueId: `field_${createUniqueId()}`,
      })}
    </Flex>
  );
}

export function Title(
  props: {
    children?: JSX.Element;
  } & OmitComponentProps<typeof Flex<"label">, "children">
) {
  const [local, others] = splitProps(props, ["children", "class", "gap"]);
  return (
    <Flex
      {...others}
      as={others.for ? "label" : "div"}
      class={combineClass("tiny-field__label", local.class)}
      gap={local.gap ?? "xs"}
    >
      {local.children}
    </Flex>
  );
}

export function RequiredIndicator(
  props: { show?: boolean } & Omit<ComponentProps<"span">, "children">
) {
  const [local, others] = splitProps(props, ["show", "class"]);
  return (
    <Show when={local.show}>
      <span
        {...others}
        aria-hidden={others["aria-hidden"] ?? "true"}
        class={combineClass("tiny-field__required-indicator", local.class)}
      >
        *
      </span>
    </Show>
  );
}

export function Description(
  props: { children?: JSX.Element } & Omit<ComponentProps<"p">, "children">
) {
  const [local, others] = splitProps(props, ["children", "class"]);
  return (
    <p {...others} class={combineClass("tiny-field__description", local.class)}>
      {local.children}
    </p>
  );
}
