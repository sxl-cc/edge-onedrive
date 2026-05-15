import {
  type ComponentProps,
  createMemo,
  createUniqueId,
  onCleanup,
  splitProps,
} from "solid-js";
import { createWatch } from "solid-tiny-utils";
import Colgroup from "./colgroup";
import context from "./context";

export function TableHeader(props: ComponentProps<"thead">) {
  const [, actions] = context.useContext();
  return (
    <>
      <Colgroup />
      <thead
        {...props}
        ref={(el) => {
          actions.setState("headerScrollRef", el);
        }}
      />
    </>
  );
}

export function Column(
  props: Omit<
    ComponentProps<"th">,
    "rowspan" | "colspan" | "rowSpan" | "colSpan"
  > & {
    width?: number;
    rowSpan?: number;
    colSpan?: number;
  }
) {
  const [, actions] = context.useContext();
  const [local, others] = splitProps(props, ["width", "rowSpan", "colSpan"]);

  const id = `col-${createUniqueId()}`;

  // maybe not , when colSpan == 1 but row is not bottom
  const isLeafColumn = createMemo(() => {
    const colSpan = Number(local.colSpan || 0);
    return colSpan <= 1;
  });

  onCleanup(() => {
    actions.setState("colsWidth", id, undefined!);
    actions.setState("colsKeys", id, undefined!);
  });

  createWatch([() => local.width, isLeafColumn], ([w, isLeaf]) => {
    actions.setState("colsWidth", id, (isLeaf ? w || 80 : undefined)!);
    actions.setState("colsKeys", id, isLeaf);
    actions.setState(
      "manualWidths",
      id,
      (isLeaf ? w || undefined : undefined)!
    );
  });

  return (
    <th
      {...others}
      colSpan={local.colSpan}
      data-key={id}
      rowSpan={local.rowSpan}
    />
  );
}
