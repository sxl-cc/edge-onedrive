import "./pagination.scss";
import { Ref } from "@solid-primitives/refs";
import { TinyPagination } from "@solid-tiny-ui/core";
import { createSignal, type JSX, onMount, Show } from "solid-js";
import { createWatch, dataIf, makeEventListener } from "solid-tiny-utils";
import { IconArrowLeft, IconArrowRight, IconEllipsis } from "../icons";

export type PaginationSize = "small" | "middle" | "large";

function GoToPageInput(props: {
  onBlur: (e: FocusEvent) => void;
  value: number;
  width: number;
}) {
  let ref!: HTMLInputElement;

  onMount(() => {
    ref.focus();
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      ref.blur();
    }
  };

  return (
    <input
      class="tiny-pagination-input"
      min="1"
      onBlur={props.onBlur}
      onKeyDown={handleKeyDown}
      ref={ref}
      style={{
        "--width": `${props.width}px`,
      }}
      type="number"
      value={props.value}
    />
  );
}

function GoToPageEditable(props: {
  current: number;
  children: JSX.Element;
  gotoPage: (page: number) => void;
  disabled: boolean;
}) {
  const [editable, setEditable] = createSignal(false);
  const [ref, setRef] = createSignal<Element | null>(null);
  const [w, setW] = createSignal(0);

  createWatch(ref, (el) => {
    if (!el) {
      return;
    }

    makeEventListener(el, "click", () => {
      setW((el as HTMLElement).offsetWidth);
      setEditable(true);
    });
  });
  return (
    <Show fallback={<Ref ref={setRef}>{props.children}</Ref>} when={editable()}>
      <GoToPageInput
        onBlur={(e) => {
          const tryTo = (e.currentTarget as HTMLInputElement).valueAsNumber;
          if (tryTo > 0 && tryTo !== props.current) {
            props.gotoPage(tryTo);
          }
          setEditable(false);
        }}
        value={props.current}
        width={w()}
      />
    </Show>
  );
}

function DensePages(props: {
  current: number;
  totalPages: number;
  onPageClick: (page: number) => void;
  disabled: boolean;
}) {
  return (
    <>
      <GoToPageEditable
        current={props.current}
        disabled={props.disabled}
        gotoPage={props.onPageClick}
      >
        <button
          class="tiny-pagination-item"
          disabled={props.disabled}
          type="button"
        >
          {props.current}
        </button>
      </GoToPageEditable>

      <span
        class="tiny-pagination-separator"
        data-disabled={dataIf(props.disabled)}
      >
        /
      </span>

      <button
        class="tiny-pagination-item"
        disabled={props.disabled}
        onClick={() => props.onPageClick(props.totalPages)}
        type="button"
      >
        {props.totalPages}
      </button>
    </>
  );
}

/**
 * A pagination component for navigating through pages of content.
 *
 * maxVisiblePages: Maximum number of page buttons to display (default: 7, minimum: 5).
 */
export function Pagination(props: {
  current: number;
  total?: number;
  pageSize?: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  maxVisiblePages?: number;
  size?: PaginationSize;
  dense?: boolean;
}) {
  const size = () => props.size ?? "middle";

  return (
    <TinyPagination.Root
      current={props.current}
      disabled={props.disabled}
      maxVisiblePages={props.maxVisiblePages}
      onChange={props.onChange}
      pageSize={props.pageSize}
      total={props.total}
    >
      {(state, actions) => (
        <div
          class="tiny-pagination"
          data-disabled={dataIf(state.disabled)}
          data-size={size()}
        >
          <button
            class="tiny-pagination-prev"
            disabled={state.disabled || state.current <= 1}
            onClick={actions.prev}
            type="button"
          >
            <IconArrowLeft />
          </button>
          <div class="tiny-pagination-items">
            <Show
              fallback={
                <DensePages
                  current={state.current}
                  disabled={state.disabled}
                  onPageClick={actions.gotoPage}
                  totalPages={state.totalPages}
                />
              }
              when={!props.dense}
            >
              <TinyPagination.Items
                render={(page) => (
                  <Show
                    fallback={
                      <GoToPageEditable
                        current={state.current}
                        disabled={state.disabled}
                        gotoPage={actions.gotoPage}
                      >
                        <button
                          class="tiny-pagination-item"
                          disabled={state.disabled}
                          type="button"
                        >
                          <IconEllipsis />
                        </button>
                      </GoToPageEditable>
                    }
                    when={page.type === "page"}
                  >
                    <button
                      class="tiny-pagination-item"
                      data-active={dataIf(page.page === state.current)}
                      disabled={state.disabled}
                      onClick={() => actions.gotoPage(page.page)}
                      type="button"
                    >
                      {page.page}
                    </button>
                  </Show>
                )}
              />
            </Show>
          </div>

          <button
            class="tiny-pagination-next"
            disabled={state.disabled || state.current >= state.totalPages}
            onClick={actions.next}
            type="button"
          >
            <IconArrowRight />
          </button>
        </div>
      )}
    </TinyPagination.Root>
  );
}
