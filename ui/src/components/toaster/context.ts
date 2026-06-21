import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { assignAccessors, createEasyContext } from "solid-tiny-utils";
import type { Toast } from "./type";

export const context = createEasyContext(
  (params: {
    defaultDuration?: () => number | undefined;
    defaultPosition?: () => Toast["position"] | undefined;
    zIndex?: () => number | "auto" | undefined;
  }) => {
    const [store, setState] = createStore({
      toasts: [] as Toast[],
      dismissSignal: {} as Record<string, boolean>,
      pauseRemoval: false,
    });

    const state = assignAccessors(store, {
      defaultDuration: createMemo(() => params.defaultDuration?.() ?? 3000),
      defaultPosition: createMemo(
        () => params.defaultPosition?.() ?? "top-center"
      ),
      zIndex: createMemo(() => params.zIndex?.() ?? 9800),
    });

    const removeToast = (id: string) => {
      setState("toasts", (toasts) => toasts.filter((toast) => toast.id !== id));

      const dismissSignal = { ...state.dismissSignal };
      delete dismissSignal[id];
      setState("dismissSignal", dismissSignal);
    };

    const getToastsByPosition = (position: Toast["position"]) =>
      state.toasts.filter((toast) => toast.position === position);

    const dismissToast = (id: string) => {
      setState("dismissSignal", id, true);
    };

    const updateToast = (
      id: string,
      updatedProps: Partial<Omit<Toast, "id">>
    ) => {
      const index = state.toasts.findIndex((toast) => toast.id === id);
      if (index !== -1 && !state.dismissSignal[id]) {
        setState("toasts", index, updatedProps);
      }
    };

    return [
      state,
      {
        setState,
        removeToast,
        getToastsByPosition,
        dismissToast,
        updateToast,
      },
    ] as const;
  }
);
