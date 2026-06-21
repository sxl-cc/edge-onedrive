import "./number-input.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
} from "@solid-tiny-ui/core";
import { createMemo, createSignal, type JSX } from "solid-js";
import { createWatch, dataIf, isDefined, isUndefined } from "solid-tiny-utils";

export interface NumberInputProps<Nullable extends boolean>
  extends AriaAndDataProps {
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  max?: number;
  min?: number;
  name?: string;
  nullable?: Nullable;
  onChange?: (value: Nullable extends true ? number | null : number) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  step?: number;
  value?: number;
  width?: JSX.CSSProperties["width"];
}

export function NumberInput<Nullable extends boolean = false>(
  props: NumberInputProps<Nullable>
) {
  const [invalid, setInvalid] = createSignal(false);

  const [inputVal, setInputVal] = createSignal<number | null>(null);

  const handleInput = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const value = target.value;

    if (value === "") {
      setInputVal(null);
      return;
    }

    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      setInputVal(numValue);
    }
  };

  const handleBlur = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const value = target.value;
    if (value === "") {
      if (props.nullable) {
        setInputVal(null);
      } else {
        // If not nullable, reset to min
        setInputVal(props.min ?? 0);
        target.value = String(inputVal());
      }
    }
  };

  const isValueInRange = createMemo(() => {
    const v = inputVal();
    if (isUndefined(v) || v === null) {
      return true;
    }

    if (isDefined(props.min) && v < props.min) {
      return false;
    }
    if (isDefined(props.max) && v > props.max) {
      return false;
    }

    return true;
  });

  createWatch(
    () => [props.invalid, isValueInRange()],
    ([invalid, isInRange]) => {
      setInvalid(!!invalid || !isInRange);
    }
  );

  createWatch(
    () => [inputVal(), invalid()] as const,
    ([val, invalid]) => {
      if (!invalid && val !== props.value) {
        if (props.nullable) {
          props.onChange?.(
            val as Nullable extends true ? number | null : number
          );
        } else {
          props.onChange?.(val === null ? (props.min ?? 0) : val);
        }
      }
    },
    { defer: true }
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      props.onPressEnter?.(e);
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div
      class="tiny-number-input-wrapper"
      data-disabled={dataIf(props.disabled ?? false)}
      data-invalid={dataIf(invalid())}
      data-size={props.size || "medium"}
      style={{ width: props.width }}
    >
      <input
        {...extraAriasAndDatasets(props)}
        aria-invalid={props["aria-invalid"] ?? (invalid() ? "true" : undefined)}
        class="tiny-number-input"
        disabled={props.disabled}
        id={props.id}
        max={props.max}
        min={props.min}
        name={props.name}
        onBlur={handleBlur}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        step={props.step}
        type="number"
        value={props.value}
      />
    </div>
  );
}
