import "./radio-group.scss";
import type { AriaAndDataProps, OmitComponentProps } from "@solid-tiny-ui/core";
import { extraAriasAndDatasets, TinyRadioGroup } from "@solid-tiny-ui/core";
import { For, splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import { combineClass, dataIf } from "solid-tiny-utils";
import { Flex } from "../../layout";

export interface RadioOption<T> {
  disabled?: boolean;
  label: JSX.Element;
  value: T;
}

export function RadioGroup<T extends string | number>(
  props: {
    options?: RadioOption<T>[];
    value?: T;
    onChange?: (value: T) => void;
    name?: string;
    disabled?: boolean;
    required?: boolean;
  } & OmitComponentProps<typeof Flex, "children"> &
    AriaAndDataProps
) {
  const [local, others] = splitProps(props, [
    "options",
    "value",
    "onChange",
    "name",
    "disabled",
    "required",
    "class",
  ]);

  return (
    <TinyRadioGroup.Root
      disabled={local.disabled}
      name={local.name}
      onChange={local.onChange}
      value={local.value}
    >
      {(rootState) => (
        <Flex
          {...extraAriasAndDatasets(props)}
          aria-required={
            props["aria-required"] ?? (local.required ? "true" : undefined)
          }
          class={combineClass("tiny-radio-group", local.class)}
          data-disabled={dataIf(rootState.disabled)}
          gap="md"
          role="radiogroup"
          {...others}
        >
          <For each={local.options}>
            {(o) => (
              <TinyRadioGroup.Item disabled={o.disabled} value={o.value}>
                {(itemState) => (
                  <TinyRadioGroup.ItemLabel
                    class="tiny-radio-item"
                    data-checked={dataIf(itemState.checked)}
                    data-disabled={dataIf(itemState.disabled)}
                  >
                    <TinyRadioGroup.ItemInput required={local.required} />
                    <span class="tiny-radio-circle" />
                    <span class="tiny-radio-label">{o.label}</span>
                  </TinyRadioGroup.ItemLabel>
                )}
              </TinyRadioGroup.Item>
            )}
          </For>
        </Flex>
      )}
    </TinyRadioGroup.Root>
  );
}
