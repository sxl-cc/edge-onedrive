/** biome-ignore-all lint/complexity/noBannedTypes: I need Function */

import "./combobox.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
  TinyListbox as Listbox,
  TinyVisuallyHidden as VisuallyHidden,
} from "@solid-tiny-ui/core";
import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  Show,
} from "solid-js";
import { createWatch, dataIf } from "solid-tiny-utils";
import { ArrowDownSLine } from "../../icons";
import { Popover } from "../../popover";
import { SpinRing } from "../../spin";

export interface ComboboxOption {
  disabled?: boolean;
  label: JSX.Element;
  value: unknown;
}

export interface ComboboxProps<T extends ComboboxOption>
  extends AriaAndDataProps {
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  loading?: boolean;
  name?: string;
  onChange?: (value: T["value"]) => void;
  options: T[];
  placeholder?: string;
  size?: "small" | "medium" | "large";
  value?: T["value"];
  variant?: "outline" | "text";
}

export function Combobox<T extends ComboboxOption>(props: ComboboxProps<T>) {
  const listboxId = `tiny-combobox-${createUniqueId()}-listbox`;
  const [value, setValue] = createSignal<T["value"] | undefined>(props.value);

  const label = createMemo(() => {
    if (value() === undefined) {
      return "";
    }

    const found = props.options.find((option) => option.value === value());
    return found ? found.label : `${value()}`; // If not found, return the value as string
  });

  const labelNotFound = createMemo(() => {
    if (value() === undefined) {
      return false;
    }
    return !props.options.some((option) => option.value === value());
  });

  createWatch(
    () => props.value,
    (v) => {
      setValue(() => v);
    },
    { defer: true }
  );

  return (
    <Popover.Root
      disabled={props.disabled || props.loading}
      placement="bottom"
      trigger="click"
    >
      {(state, acts) => (
        <>
          <Popover.Trigger>
            <button
              {...extraAriasAndDatasets(props)}
              aria-controls={props["aria-controls"] ?? listboxId}
              aria-disabled={
                props.disabled || props.loading ? "true" : undefined
              }
              aria-expanded={state.open ? "true" : "false"}
              aria-haspopup="listbox"
              aria-invalid={
                props["aria-invalid"] ??
                (labelNotFound() || props.invalid ? "true" : undefined)
              }
              class="tiny-combobox__trigger"
              data-disabled={dataIf(props.disabled ?? false)}
              data-empty={dataIf(!label())}
              data-invalid={dataIf((labelNotFound() || props.invalid) ?? false)}
              data-loading={dataIf(props.loading ?? false)}
              data-open={dataIf(state.open)}
              data-size={props.size ?? "medium"}
              data-variant={props.variant ?? "outline"}
              disabled={props.disabled || props.loading}
              id={props.id}
              role="combobox"
              type="button"
            >
              <VisuallyHidden>
                <input
                  name={props.name}
                  type="hidden"
                  value={String(value() ?? "")}
                />
              </VisuallyHidden>
              <div class="tiny-combobox__label">
                {label() || props.placeholder}
              </div>
              <div class="tiny-combobox__suffix">
                <Show
                  fallback={
                    <div
                      style={{
                        "margin-top": "2px",
                      }}
                    >
                      <ArrowDownSLine />
                    </div>
                  }
                  when={props.loading}
                >
                  <SpinRing color="inherit" size={16} />
                </Show>
              </div>
            </button>
          </Popover.Trigger>
          <Popover.Content
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            <Listbox.Root
              aria-labelledby={props.id}
              autofocus
              class="tiny-combobox__options tiny-combobox-vars"
              id={listboxId}
              style={{
                "--tiny-combobox-trigger-width": `${state.refTrigger?.offsetWidth}px`,
              }}
            >
              <For each={props.options}>
                {(option) => (
                  <Listbox.Item
                    class="tiny-combobox__option"
                    data-selected={dataIf(option.value === value())}
                    disabled={option.disabled}
                    focus={option.value === value()}
                    onClick={() => {
                      props.onChange?.(option.value);
                      setValue(option.value);
                      acts.setOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        props.onChange?.(option.value);
                        setValue(option.value);
                        acts.setOpen(false);
                      }
                    }}
                  >
                    {option.label}
                  </Listbox.Item>
                )}
              </For>
            </Listbox.Root>
          </Popover.Content>
        </>
      )}
    </Popover.Root>
  );
}
