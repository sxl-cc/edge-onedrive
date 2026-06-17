import { useNavigate } from "@solidjs/router";
import { createSignal, For, type JSX, Show } from "solid-js";
import { createStore } from "solid-js/store";
import {
  combineClass,
  createEventListener,
  createVisibilityObserver,
  createWatch,
  list,
  runAtNextAnimationFrame,
} from "solid-tiny-utils";
import { formatToDateTime } from "time-core";
import type { MsGraphDriveItem } from "~api";
import { useTranslator } from "../../i18n";
import { sizeToString } from "../../utils/size";
import { TableCore } from "../tiny-table";
import { getDriveItemIconClass } from "./item-icon-cls";

function DriveItemRow(props: {
  item: MsGraphDriveItem;
  active: boolean;
  onActive: () => void;
  itemUrl: (item: MsGraphDriveItem) => string;
}) {
  const rowClass = () => {
    const classes = ["cursor-pointer"];
    if (props.active) {
      classes.push("bg-neutral-3/25");
    } else {
      classes.push("hover:bg-neutral-2/20");
    }
    return classes.join(" ");
  };

  const $n = useNavigate();

  return (
    <TableCore.Row
      class={rowClass()}
      onClick={() => {
        if (props.active) {
          $n(props.itemUrl(props.item));
        } else {
          props.onActive();
        }
      }}
    >
      <TableCore.Cell class="h-46px px-sm">
        <div class="flex items-center">
          <div
            class={combineClass(
              getDriveItemIconClass(props.item),
              "c-text-label fs-lg flex-shrink-0"
            )}
          />
          <div class="ml-sm max-w-full truncate">{props.item.name}</div>
        </div>
      </TableCore.Cell>
      <TableCore.Cell class="h-40px px-sm">
        <div class="max-w-full truncate">{sizeToString(props.item.size)}</div>
      </TableCore.Cell>
      <TableCore.Cell class="h-40px px-sm">
        <div class="max-w-full truncate">
          {formatToDateTime(props.item.created_at)}
        </div>
      </TableCore.Cell>
    </TableCore.Row>
  );
}

function DriveItemRowsSkeleton() {
  return (
    <TableCore.Row>
      <TableCore.Cell class="h-46px px-sm">
        <div class="h-60% w-25% animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      </TableCore.Cell>
      <TableCore.Cell class="h-40px px-sm">
        <div class="h-60% w-20% animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      </TableCore.Cell>
      <TableCore.Cell class="h-40px px-sm">
        <div class="h-60% w-30% animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      </TableCore.Cell>
    </TableCore.Row>
  );
}

function ContentRow(props: { children: JSX.Element; class?: string }) {
  const [state] = TableCore.useContext();
  return (
    <TableCore.Row>
      <TableCore.Cell colSpan="3">
        <div
          class={combineClass(
            "sticky left-0 flex flex-col items-center justify-center",
            props.class
          )}
          style={{ width: `${state.wrapperWidth}px` }}
        >
          {props.children}
        </div>
      </TableCore.Cell>
    </TableCore.Row>
  );
}

export function DriveItemsView(props: {
  items: MsGraphDriveItem[];
  itemUrl: (item: MsGraphDriveItem) => string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => boolean | Promise<boolean>;
  error?: boolean;
}) {
  const t = useTranslator();

  const [state, setState] = createStore({
    activeItem: -1,
  });

  createWatch(
    () => props.items,
    () => {
      setState("activeItem", -1);
    }
  );

  const [widthRef, setWidthRef] = createSignal<HTMLDivElement>();
  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement>();
  const [headerRef, setHeaderRef] = createSignal<HTMLDivElement>();
  const [loadMoreRef, setLoadMoreRef] = createSignal<HTMLDivElement>();

  createEventListener(scrollRef, "scroll", (e: MouseEvent) => {
    const el = headerRef();
    const tar = e.target as HTMLDivElement;
    if (el) {
      el.scrollLeft = tar.scrollLeft;
    }
  });

  const useVisibilityObserver = createVisibilityObserver({
    threshold: 0,
    rootMargin: "100px",
  });

  const isVisible = useVisibilityObserver(loadMoreRef);

  const checkNeedMore = () => {
    if (!props.hasMore) {
      return;
    }
    const wrapperEl = scrollRef();
    const loadMoreEl = loadMoreRef();
    if (!(wrapperEl && loadMoreEl)) {
      return;
    }

    const rootRect = wrapperEl.getBoundingClientRect();
    const loadMoreRect = loadMoreEl.getBoundingClientRect();
    const visible =
      loadMoreRect.top <= rootRect.bottom + 100 &&
      loadMoreRect.bottom >= rootRect.top;

    if (visible) {
      loadMore();
    }
  };

  const loadMore = async () => {
    if (!props.hasMore) {
      return;
    }

    const needMore = await props.onLoadMore?.();
    if (needMore) {
      runAtNextAnimationFrame(checkNeedMore);
    }
  };

  createWatch(isVisible, (isVisible) => {
    if (isVisible) {
      loadMore();
    }
  });

  return (
    <TableCore class={"flex h-full w-full flex-col"} widthRef={widthRef()}>
      <div class="b-b b-neutral-1/50 w-full flex-shrink-0">
        <TableCore.Table ref={setHeaderRef}>
          <TableCore.Header>
            <For
              each={[
                t("global.name"),
                t("global.size"),
                t("global.created_at"),
              ]}
            >
              {(label) => (
                <TableCore.Column class="fw-normal c-text-label fs-xs px-sm py-md text-align-left">
                  {label}
                </TableCore.Column>
              )}
            </For>
          </TableCore.Header>
        </TableCore.Table>
      </div>
      <div
        class="relative w-full flex-1 overflow-auto"
        ref={setScrollRef}
        style={{
          "scrollbar-width": "thin",
          "scrollbar-color": "rgb(var(--tiny-rgb-neutral-0))",
          "scroll-behavior": "smooth",
        }}
      >
        <TableCore.Table>
          <TableCore.Body>
            <Show
              fallback={
                <For each={list(5)}>{() => <DriveItemRowsSkeleton />}</For>
              }
              when={!(props.loading || props.error)}
            >
              <For each={props.items}>
                {(driveItem, index) => (
                  <DriveItemRow
                    active={index() === state.activeItem}
                    item={driveItem}
                    itemUrl={props.itemUrl}
                    onActive={() => {
                      setState("activeItem", index());
                    }}
                  />
                )}
              </For>
              <Show when={props.hasMore}>
                <ContentRow>
                  <div
                    class="i-ri:loader-2-line animate-spin p-md"
                    ref={setLoadMoreRef}
                  />
                </ContentRow>
              </Show>
            </Show>
          </TableCore.Body>
        </TableCore.Table>
        <div class="absolute top-0 right-0 left-0" ref={setWidthRef} />
      </div>
    </TableCore>
  );
}
