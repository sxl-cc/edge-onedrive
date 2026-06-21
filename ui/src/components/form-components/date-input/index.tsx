import "./date-input.scss";
import {
  type AriaAndDataProps,
  extraAriasAndDatasets,
  TinyDateField,
  TinyVisuallyHidden as VisuallyHidden,
} from "@solid-tiny-ui/core";
import { Show } from "solid-js";
import { dataIf } from "solid-tiny-utils";
import type { DateArgs } from "time-core";
import { CalendarLine } from "../../icons/calender-line";

/**
 * A compatible date input component that implements modern `<input type="date">` and `<input type="datetime-local">` features, with better accessibility and user experience.
 *
 * It should supports most of the features of native date input - keyboard input, dropdown calendar
 *
 * type="datetime-local"
 */
export function DateInput(
  props: {
    value: DateArgs;
    type?: "date" | "datetime-local" | "month";
    size?: "small" | "medium" | "large";
    invalid?: boolean;
    id?: string;
    onChange: (date: string) => void;
  } & AriaAndDataProps
) {
  return (
    <TinyDateField.Root
      onChange={(value) => props.onChange(value)}
      type={props.type}
      value={props.value}
    >
      <fieldset
        {...extraAriasAndDatasets(props)}
        aria-invalid={
          props["aria-invalid"] ?? (props.invalid ? "true" : undefined)
        }
        class="tiny-date-input"
        data-invalid={dataIf(props.invalid ?? false)}
        data-size={props.size ?? "medium"}
        id={props.id}
      >
        <VisuallyHidden as="input" />
        <TinyDateField.Segment
          class="tiny-date-input__btn"
          contentClass="tiny-date-input__content"
          field="year"
          layerClass="tiny-date-input__layer"
        />
        <span>/</span>
        <TinyDateField.Segment
          class="tiny-date-input__btn"
          contentClass="tiny-date-input__content"
          field="month"
          layerClass="tiny-date-input__layer"
        />
        <Show when={props.type !== "month"}>
          <span>/</span>
          <TinyDateField.Segment
            class="tiny-date-input__btn"
            contentClass="tiny-date-input__content"
            field="day"
            layerClass="tiny-date-input__layer"
          />
        </Show>

        <Show when={props.type === "datetime-local"}>
          <span>&nbsp;</span>
          <TinyDateField.Segment
            class="tiny-date-input__btn"
            contentClass="tiny-date-input__content"
            field="hour"
            layerClass="tiny-date-input__layer"
          />
          <span>:</span>
          <TinyDateField.Segment
            class="tiny-date-input__btn"
            contentClass="tiny-date-input__content"
            field="minute"
            layerClass="tiny-date-input__layer"
          />
          <span>:</span>
          <TinyDateField.Segment
            class="tiny-date-input__btn"
            contentClass="tiny-date-input__content"
            field="second"
            layerClass="tiny-date-input__layer"
          />
        </Show>

        <span>&nbsp;</span>
        <CalendarLine />
      </fieldset>
    </TinyDateField.Root>
  );
}
