import type { AriaAndDataProps, OmitComponentProps } from "@solid-tiny-ui/core";
import { TinyCheckboxGroup } from "@solid-tiny-ui/core";
import { For, splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { Flex } from "../../layout";
import { Checkbox } from "../checkbox";

export interface CheckboxOption<T> {
  disabled?: boolean;
  label: JSX.Element;
  value: T;
}

export function CheckboxGroup<T extends string | number>(
  props: {
    options?: CheckboxOption<T>[];
    value?: T[];
    onChange?: (value: T[]) => void;
    disabled?: boolean;
    name?: string;
    required?: boolean;
  } & OmitComponentProps<typeof Flex, "children"> &
    AriaAndDataProps
) {
  const [local, others] = splitProps(props, [
    "options",
    "value",
    "onChange",
    "disabled",
    "name",
    "required",
  ]);

  return (
    <TinyCheckboxGroup.Root
      disabled={local.disabled}
      name={local.name}
      onChange={local.onChange}
      selectValues={local.value}
    >
      {(state, actions) => (
        <Flex
          aria-required={
            props["aria-required"] ?? (local.required ? "true" : undefined)
          }
          data-disabled={state.disabled}
          gap="md"
          role="group"
          {...others}
        >
          <For each={local.options}>
            {(o) => (
              <Checkbox
                checked={state.selectValues.includes(o.value)}
                disabled={state.disabled || o.disabled}
                name={state.name}
                onChange={(c) => actions.toggleValue(o.value, c)}
                required={local.required}
                value={String(o.value)}
              >
                {o.label}
              </Checkbox>
            )}
          </For>
        </Flex>
      )}
    </TinyCheckboxGroup.Root>
  );
}
