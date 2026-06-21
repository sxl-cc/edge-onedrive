import { createResizeObserver } from "@solid-primitives/resize-observer";
import { type ComponentProps, onMount, splitProps } from "solid-js";
import { createWatch } from "solid-tiny-utils";
import context from "./context";

export default function Table(
  props: ComponentProps<"div"> & {
    widthRef?: HTMLDivElement;
  }
) {
  const Context = context.initial({});
  const [local, others] = splitProps(props, ["ref", "widthRef"]);
  const [state, actions] = Context.value;

  onMount(() => {
    createResizeObserver(
      () => local.widthRef,
      (_, el) => {
        const clientWidth = el.clientWidth;
        if (state.wrapperWidth === clientWidth) {
          return;
        }

        actions.setState("wrapperWidth", clientWidth);
        actions.refresh(clientWidth);
      }
    );

    createWatch(
      [() => ({ ...state.manualWidths })],
      () => {
        const el = local.widthRef;
        if (!el?.clientWidth) {
          return;
        }

        const clientWidth = el.clientWidth;
        actions.setState("wrapperWidth", clientWidth);
        actions.refresh(clientWidth);
      },
      { defer: true }
    );
  });

  return (
    <Context.Provider>
      <div {...others} />
    </Context.Provider>
  );
}
