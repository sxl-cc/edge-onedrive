import "./button.scss";
import { extraAriasAndDatasets, TinyButton } from "@solid-tiny-ui/core";
import type { JSX } from "solid-js/jsx-runtime";
import { dataIf, type MaybePromise } from "solid-tiny-utils";
import { SpinRing } from "../spin";

export type ButtonVariants = "solid" | "text" | "subtle";

export interface ButtonProps {
  children?: JSX.Element;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: MouseEvent) => MaybePromise<void>;
  size?: "small" | "medium" | "large";
  type?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  variant?: ButtonVariants;
}

export function Button(props: ButtonProps) {
  return (
    <TinyButton.Root
      disabled={props.disabled}
      loading={props.loading}
      onClick={props.onClick}
    >
      {(buttonState, buttonActions) => (
        <button
          {...extraAriasAndDatasets(props)}
          aria-busy={buttonState.isLoading}
          class="tiny-btn"
          data-disabled={dataIf(buttonState.disabled)}
          data-loading={dataIf(buttonState.isLoading)}
          data-size={props.size ?? "medium"}
          data-variant={props.variant ?? "solid"}
          disabled={buttonState.disabled}
          onClick={buttonActions.handleClick}
          type={props.type ?? "button"}
        >
          <span class="tiny-btn__content">{props.children}</span>
          <span class="tiny-btn__loader">
            <SpinRing color="currentColor" size={18} />
          </span>
        </button>
      )}
    </TinyButton.Root>
  );
}
