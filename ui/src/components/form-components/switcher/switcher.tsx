import "./switcher.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
  TinyCheckbox,
} from "@solid-tiny-ui/core";
import { children, type JSX } from "solid-js";
import { dataIf } from "solid-tiny-utils";

export function Switcher(
  props: {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    children?: JSX.Element;
    id?: string;
    name?: string;
    value?: string;
    required?: boolean;
  } & AriaAndDataProps
) {
  const label = children(() => props.children);

  return (
    <TinyCheckbox.Root
      checked={props.checked}
      disabled={props.disabled}
      name={props.name}
      onChange={props.onChange}
      value={props.value}
    >
      {(state) => (
        <TinyCheckbox.Label
          class="tiny-switcher"
          data-checked={dataIf(state.checked)}
          data-disabled={dataIf(state.disabled)}
        >
          <TinyCheckbox.Input
            {...extraAriasAndDatasets(props)}
            id={props.id}
            required={props.required}
            role="switch"
          />
          <div class="tiny-switcher-track">
            <div class="tiny-switcher-thumb" />
          </div>
          <span class="tiny-switcher-label">{label()}</span>
        </TinyCheckbox.Label>
      )}
    </TinyCheckbox.Root>
  );
}
