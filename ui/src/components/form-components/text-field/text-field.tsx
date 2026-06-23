import "./text-field.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
} from "@solid-tiny-ui/core";
import { children, type JSX, Show } from "solid-js";
import { dataIf } from "solid-tiny-utils";

export interface TextFieldProps extends AriaAndDataProps {
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onChange?: (value: string) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  placeholder?: string;
  prefix?: JSX.Element;
  readOnly?: boolean;
  size?: "small" | "medium" | "large";
  suffix?: JSX.Element;
  value?: string;
}

export function TextField(props: TextFieldProps) {
  const prefix = children(() => props.prefix);
  const suffix = children(() => props.suffix);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      props.onPressEnter?.(e);
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div
      class="tiny-text-field"
      data-disabled={dataIf(props.disabled ?? false)}
      data-invalid={dataIf(props.invalid ?? false)}
      data-read-only={dataIf(props.readOnly ?? false)}
      data-size={props.size || "medium"}
    >
      <Show when={prefix()}>
        <div class="tiny-text-field-prefix">{prefix()}</div>
      </Show>
      <input
        {...extraAriasAndDatasets(props)}
        aria-invalid={
          props["aria-invalid"] ?? (props.invalid ? "true" : undefined)
        }
        class="tiny-text-field-input"
        disabled={props.disabled}
        id={props.id}
        name={props.name}
        onInput={(e) => {
          props.onChange?.(e.currentTarget.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        type="text"
        value={props.value}
      />
      <Show when={suffix()}>
        <div class="tiny-text-field-suffix">{suffix()}</div>
      </Show>
    </div>
  );
}
