import { type DateFieldValue, TinyDateField } from "@solid-tiny-ui/core";
import { addMonths, getMonth, getYear } from "time-core";
import { IconArrowLeft, IconArrowRight } from "../icons";

export function HeadTool(props: {
  year: number;
  month: number;
  onYearMonthChange: (year: number, month: number) => void;
}) {
  const shiftMonth = (offset: number) => {
    const next = addMonths([props.year, props.month], offset);
    props.onYearMonthChange(getYear(next), getMonth(next));
  };

  const handleFieldChange = (_value: string, fields: DateFieldValue) => {
    if (fields.year !== props.year || fields.month !== props.month) {
      props.onYearMonthChange(fields.year, fields.month);
    }
  };

  return (
    <div class="tiny-calendar__head-tool">
      <TinyDateField.Root
        debounceDelay={0}
        onChange={handleFieldChange}
        type="month"
        value={[props.year, props.month]}
      >
        <div class="tiny-calendar__title">
          <TinyDateField.Segment
            class="tiny-calendar__title-segment"
            contentClass="tiny-calendar__title-segment-content"
            field="year"
            layerClass="tiny-calendar__title-segment-layer"
          />
          <span class="tiny-calendar__title-separator">/</span>
          <TinyDateField.Segment
            class="tiny-calendar__title-segment"
            contentClass="tiny-calendar__title-segment-content"
            field="month"
            layerClass="tiny-calendar__title-segment-layer"
          />
        </div>
      </TinyDateField.Root>
      <div>
        <button
          aria-label="Previous month"
          class="tiny-calendar__nav"
          onClick={() => shiftMonth(-1)}
          type="button"
        >
          <IconArrowLeft />
        </button>

        <button
          aria-label="Next month"
          class="tiny-calendar__nav"
          onClick={() => shiftMonth(1)}
          type="button"
        >
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
