import "./calendar-view.scss";
import {
  type CalendarViewDayState,
  type CalendarViewRange,
  TinyCalendarView,
} from "@solid-tiny-ui/core";
import type { JSX } from "solid-js";
import type { CalendarLocale } from "./calendar";

export type {
  CalendarViewDayState,
  CalendarViewRange,
} from "@solid-tiny-ui/core";

export function CalendarView(props: {
  year: number;
  month: number;
  day: (state: CalendarViewDayState) => JSX.Element;
  weekday?: (label: string, index: number) => JSX.Element;
  onRangeChange?: (range: CalendarViewRange) => void;
  onYearMonthChange: (year: number, month: number) => void;
  locale?: CalendarLocale;
  cellSize: number;
}) {
  return (
    <TinyCalendarView.Root
      cellSize={props.cellSize}
      class="tiny-calendar-view"
      locale={props.locale}
      month={props.month}
      onRangeChange={props.onRangeChange}
      onYearMonthChange={props.onYearMonthChange}
      year={props.year}
    >
      <TinyCalendarView.Weekdays class="tiny-calendar-view__weekdays">
        {props.weekday}
      </TinyCalendarView.Weekdays>
      <TinyCalendarView.Viewport class="tiny-calendar-view__days-viewport">
        <TinyCalendarView.Inner class="tiny-calendar-view__days-inner">
          <TinyCalendarView.Weeks weekClass="tiny-calendar-view__week">
            {props.day}
          </TinyCalendarView.Weeks>
        </TinyCalendarView.Inner>
      </TinyCalendarView.Viewport>
    </TinyCalendarView.Root>
  );
}
