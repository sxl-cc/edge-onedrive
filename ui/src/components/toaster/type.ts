import type { MaybeCallableChild } from "solid-tiny-utils";

export interface Toast {
  duration: number;
  icon: MaybeCallableChild<[Omit<Toast, "icon" | "message">]>;
  id: string;
  message: MaybeCallableChild<[Omit<Toast, "icon" | "message">]>;
  position: ToastPosition;
  type: ToastType;
}

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "blank"
  | "loading";
