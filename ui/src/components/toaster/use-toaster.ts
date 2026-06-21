import { createUniqueId } from "solid-js";
import {
  callMaybeCallableChild,
  type MaybeCallableChild,
} from "solid-tiny-utils";
import { context } from "./context";
import type { Toast } from "./type";

type ToasterFunction = (
  msg: MaybeCallableChild<[{ id: string }]>,
  opt?: Partial<Omit<Toast, "id" | "message">>
) => string;

function createPreset<T extends Partial<Omit<Toast, "id" | "message">>>(
  presets: T,
  toast: ToasterFunction
) {
  return (
    msg: MaybeCallableChild<[{ id: string }]>,
    opt?: Omit<Partial<Omit<Toast, "id" | "message">>, keyof T>
  ) =>
    toast(msg, {
      ...presets,
      ...opt,
    });
}

export function useToaster() {
  const [state, actions] = context.useContext();

  const toast = (
    msg: MaybeCallableChild<[{ id: string }]>,
    opt?: {
      duration?: number;
      position?: Toast["position"];
      type?: Toast["type"];
      icon?: Toast["icon"];
    }
  ) => {
    const id = `toast-${createUniqueId()}`;
    actions.setState("toasts", (toasts) => [
      {
        id,
        type: opt?.type || "blank",
        duration: opt?.duration ?? state.defaultDuration,
        position: opt?.position || state.defaultPosition,
        message: msg,
        icon: opt?.icon ?? null,
      },
      ...toasts,
    ]);
    return id;
  };

  return Object.assign(toast, {
    blank: createPreset({ type: "blank" }, toast),
    loading: createPreset({ type: "loading", duration: 0 }, toast),
    success: createPreset({ type: "success" }, toast),
    error: createPreset({ type: "error" }, toast),
    info: createPreset({ type: "info" }, toast),
    warning: createPreset({ type: "warning" }, toast),
    promise: createPromiseToast(toast, actions.updateToast),
    dismiss: actions.dismissToast,
    update: actions.updateToast,
  });
}

function createPromiseToast(
  toast: ToasterFunction,
  update: (id: string, toast: Partial<Toast>) => void
) {
  return <T>(
    promise: Promise<T>,
    phase: {
      loading: MaybeCallableChild<[{ id: string }]>;
      success: MaybeCallableChild<[{ id: string; data: T }]>;
      error: MaybeCallableChild<[{ id: string; error: unknown }]>;
    }
  ) => {
    const id = toast(
      (params) => callMaybeCallableChild(phase.loading, { ...params }),
      { type: "loading", duration: 0 }
    );
    promise
      .then((data) => {
        update(id, {
          type: "success",
          duration: 5000,
          message: ({ id }) =>
            callMaybeCallableChild(phase.success, { id, data }),
        });
      })
      .catch((error) => {
        update(id, {
          type: "error",
          duration: 5000,
          message: ({ id }) =>
            callMaybeCallableChild(phase.error, { id, error }),
        });
      });
  };
}
