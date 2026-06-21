import "./checkbox.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
  TinyCheckbox,
} from "@solid-tiny-ui/core";
import { children, type JSX, Show } from "solid-js";
import { dataIf } from "solid-tiny-utils";
import { IconSubtract } from "../../icons";
import { CheckBold } from "../../icons/check-bold";

export function Checkbox(
  props: {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    value?: string;
    name?: string;
    id?: string;
    children?: JSX.Element;
    indeterminate?: boolean;
    required?: boolean;
  } & AriaAndDataProps
) {
  const label = children(() => props.children);

  return (
    <TinyCheckbox.Root
      checked={props.checked}
      disabled={props.disabled}
      indeterminate={props.indeterminate}
      name={props.name}
      onChange={props.onChange}
      value={props.value}
    >
      {(state) => (
        <TinyCheckbox.Label
          class="tiny-checkbox"
          data-checked={dataIf(state.checked)}
          data-disabled={dataIf(state.disabled)}
          data-indeterminate={dataIf(state.indeterminate)}
        >
          <TinyCheckbox.Input
            {...extraAriasAndDatasets(props)}
            id={props.id}
            required={props.required}
          />
          <div class="tiny-checkbox-box">
            <div class="tiny-checkbox-indicator">
              <Show
                fallback={<IconSubtract size="100%" />}
                when={!props.indeterminate}
              >
                <CheckBold size="100%" />
              </Show>
            </div>
          </div>
          <Show when={label()}>
            <span class="tiny-checkbox-label">{label()}</span>
          </Show>
        </TinyCheckbox.Label>
      )}
    </TinyCheckbox.Root>
  );
}
