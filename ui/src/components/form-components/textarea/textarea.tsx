import "./textarea.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
} from "@solid-tiny-ui/core";
import { type JSX, mergeProps } from "solid-js";
import { dataIf } from "solid-tiny-utils";

export function Textarea(
  props: {
    autosize?: boolean;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
    resize?: JSX.CSSProperties["resize"];
    onChange?: (value: string) => void;
    invalid?: boolean;
    value?: string;
    id?: string;
    name?: string;
  } & AriaAndDataProps
) {
  const real = mergeProps(
    {
      autosize: false,
      rows: 3,
      disabled: false,
    },
    props
  );

  return (
    <textarea
      {...extraAriasAndDatasets(props)}
      aria-invalid={
        props["aria-invalid"] ?? (real.invalid ? "true" : undefined)
      }
      class="tiny-textarea"
      data-invalid={dataIf(real.invalid ?? false)}
      disabled={real.disabled}
      id={props.id}
      maxLength={real.maxLength}
      name={props.name}
      onInput={(e) => {
        props.onChange?.((e.target as HTMLTextAreaElement).value);
      }}
      placeholder={real.placeholder}
      rows={real.rows}
      style={{
        resize: real.resize,
        "min-height": "88px",
      }}
      value={real.value}
    />
  );
}
