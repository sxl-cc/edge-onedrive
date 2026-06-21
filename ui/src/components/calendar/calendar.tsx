import "./calendar.scss";
import { createSignal } from "solid-js";
import { createDebounce, createWatch, dataIf } from "solid-tiny-utils";
import { getDay, getMonth, getYear, isSameDate } from "time-core";
import { CalendarView, type CalendarViewRange } from "./calendar-view";
import { HeadTool } from "./head-tool";
import { getDateKey } from "./utils";

export interface CalendarLocale {
  shortWeekDays?: string[];
  weekStartsOn?: number;
}

export type CalendarDateValue = Date | string;
export type CalendarDateSource = (view: {
  year: number;
  month: number;
  start: Date;
  end: Date;
}) => CalendarDateValue[] | Promise<CalendarDateValue[]>;

export interface CalendarProps {
  current?: Date;
  defaultCurrent?: Date;
  disabled?: boolean;
  disabledDates?: CalendarDateSource;
  highlightedDates?: CalendarDateSource;
  locale?: CalendarLocale;
  onChange?: (date: Date) => void;
  onYearMonthChange?: (year: number, month: number) => void;
}

export function Calendar(props: CalendarProps) {
  const initialCurrent = () =>
    props.current ?? props.defaultCurrent ?? new Date();
  const [innerCurrent, setInnerCurrent] = createSignal(initialCurrent());
  const current = () => props.current ?? innerCurrent();
  const [viewYear, setViewYear] = createSignal(getYear(initialCurrent()));
  const [viewMonth, setViewMonth] = createSignal(getMonth(initialCurrent()));
  const [viewRange, setViewRange] = createSignal<CalendarViewRange>();
  const [disabledDateKeys, setDisabledDateKeys] = createSignal(
    new Set<string>()
  );
  const [highlightedDateKeys, setHighlightedDateKeys] = createSignal(
    new Set<string>()
  );
  const [isDateSourceLoading, setIsDateSourceLoading] = createSignal(false);

  createWatch(
    () => props.current,
    (date) => {
      if (!date) {
        return;
      }
      setViewYear(getYear(date));
      setViewMonth(getMonth(date));
    }
  );

  const changeYearMonth = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    props.onYearMonthChange?.(year, month);
  };

  let dateSourceRequestId = 0;
  const loadDateSources = createDebounce(
    async (
      requestId: number,
      view: CalendarViewRange,
      disabledDates?: CalendarDateSource,
      highlightedDates?: CalendarDateSource
    ) => {
      const [disabled, highlighted] = await Promise.all([
        disabledDates?.(view) ?? [],
        highlightedDates?.(view) ?? [],
      ]).catch(() => [[], []] as [CalendarDateValue[], CalendarDateValue[]]);

      if (requestId !== dateSourceRequestId) {
        return;
      }

      setDisabledDateKeys(new Set(disabled.map(getDateKey)));
      setHighlightedDateKeys(new Set(highlighted.map(getDateKey)));
      setIsDateSourceLoading(false);
    },
    120
  );

  createWatch(
    () => [viewRange(), props.disabledDates, props.highlightedDates] as const,
    ([range, disabledDates, highlightedDates]) => {
      const requestId = ++dateSourceRequestId;
      if (!(range && (disabledDates || highlightedDates))) {
        setDisabledDateKeys(new Set<string>());
        setHighlightedDateKeys(new Set<string>());
        setIsDateSourceLoading(false);
        return;
      }

      setIsDateSourceLoading(true);
      loadDateSources(requestId, range, disabledDates, highlightedDates);
    }
  );

  const handleDateClick = (date: Date) => {
    setInnerCurrent(date);
    props.onChange?.(date);

    const year = getYear(date);
    const month = getMonth(date);
    if (year !== viewYear() || month !== viewMonth()) {
      changeYearMonth(year, month);
    }
  };

  const today = new Date();

  return (
    <div class="tiny-calendar" data-disabled={props.disabled ? "" : undefined}>
      <HeadTool
        month={viewMonth()}
        onYearMonthChange={changeYearMonth}
        year={viewYear()}
      />
      <CalendarView
        cellSize={32}
        day={(state) => {
          const dateKey = getDateKey(state.date);
          const isDateDisabled = disabledDateKeys().has(dateKey);

          return (
            <button
              aria-pressed={isSameDate(state.date, current())}
              class="tiny-calendar-view__day"
              data-current={dataIf(isSameDate(state.date, current()))}
              data-current-month={dataIf(state.isCurrentMonth)}
              data-highlighted={dataIf(highlightedDateKeys().has(dateKey))}
              data-loading={dataIf(isDateSourceLoading())}
              data-today={dataIf(isSameDate(state.date, today))}
              disabled={props.disabled || isDateDisabled}
              onClick={() => {
                if (isDateSourceLoading() || isDateDisabled) {
                  return;
                }
                handleDateClick(state.date);
              }}
              type="button"
            >
              {getDay(state.date)}
            </button>
          );
        }}
        locale={props.locale}
        month={viewMonth()}
        onRangeChange={setViewRange}
        onYearMonthChange={changeYearMonth}
        year={viewYear()}
      />
    </div>
  );
}
