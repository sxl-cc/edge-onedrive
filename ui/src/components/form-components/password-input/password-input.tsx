import "./password-input.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
  TinyPasswordField,
} from "@solid-tiny-ui/core";
import type { JSX } from "solid-js";
import { dataIf } from "solid-tiny-utils";
import { EyeLine, EyeOffLine } from "../../icons";

export interface PasswordInputProps extends AriaAndDataProps {
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  value?: string;
  width?: JSX.CSSProperties["width"];
}

export function PasswordInput(props: PasswordInputProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      props.onPressEnter?.(e);
    }
  };

  return (
    <TinyPasswordField.Root disabled={props.disabled}>
      {(state) => (
        <div
          class="tiny-password-input-wrapper"
          data-disabled={dataIf(state.disabled)}
          data-invalid={dataIf(props.invalid ?? false)}
          data-size={props.size || "medium"}
          style={{ width: props.width }}
        >
          <TinyPasswordField.Input
            {...extraAriasAndDatasets(props)}
            aria-invalid={
              props["aria-invalid"] ?? (props.invalid ? "true" : undefined)
            }
            class="tiny-password-input"
            id={props.id}
            name={props.name}
            onInput={(e) => {
              props.onChange?.(e.currentTarget.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder}
            value={props.value}
          />
          <TinyPasswordField.Toggle
            aria-label={state.visible ? "Hide password" : "Show password"}
            class="tiny-password-input-toggle"
            data-disabled={dataIf(state.disabled)}
          >
            {state.visible ? <EyeOffLine /> : <EyeLine />}
          </TinyPasswordField.Toggle>
        </div>
      )}
    </TinyPasswordField.Root>
  );
}
