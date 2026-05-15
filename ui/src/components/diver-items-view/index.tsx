import { useNavigate } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";
import { combineClass } from "solid-tiny-utils";
import type { MsGraphDriveItem } from "~api";
import { useTranslator } from "../../i18n";
import { sizeToString } from "../../utils/size";
import { TableCore } from "../tiny-table";

const iconClass = (item: MsGraphDriveItem) => {
  if (item.is_folder) {
    return "i-ri:folder-6-line";
  }

  if (item.mime_type.startsWith("image/")) {
    return "i-ri:image-line";
  }

  if (item.mime_type.startsWith("video/")) {
    return "i-ri:video-line";
  }

  if (item.mime_type.startsWith("audio/")) {
    return "i-ri:music-line";
  }

  return "i-ri:file-line";
};

function DriveItemRow(props: {
  item: MsGraphDriveItem;
  active: boolean;
  onActive: () => void;
  itemUrl: (item: MsGraphDriveItem) => string;
}) {
  const rowClass = () => {
    const classes = ["cursor-pointer"];
    if (props.active) {
      classes.push("bg-neutral-2/25");
    } else {
      classes.push("hover:bg-neutral-1/25");
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
      <TableCore.Cell class="px-sm">
        <div class="flex items-center">
          <div class={combineClass(iconClass(props.item), "flex-shrink-0")} />
          <div class="ml-sm max-w-full truncate">{props.item.name}</div>
        </div>
      </TableCore.Cell>
      <TableCore.Cell class="px-sm">
        {sizeToString(props.item.size)}
      </TableCore.Cell>
      <TableCore.Cell class="px-sm">
        {props.item.is_folder ? "folder" : "file"}
      </TableCore.Cell>
    </TableCore.Row>
  );
}

export function DriveItemsView(props: {
  items: MsGraphDriveItem[];
  itemUrl: (item: MsGraphDriveItem) => string;
  canLoadMore?: boolean;
}) {
  const t = useTranslator();

  const [state, setState] = createStore({
    activeItem: -1,
  });

  const [widthRef, setWidthRef] = createSignal<HTMLDivElement>();

  return (
    <TableCore class={"w-full"} widthRef={widthRef()}>
      <div class="b-b b-neutral-1/50 w-full">
        <TableCore.Table>
          <TableCore.Header>
            <For each={[t("global.name"), t("global.size"), t("global.type")]}>
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
        class="relative h-400px w-full overflow-auto"
        style={{
          "scrollbar-width": "thin",
          "scrollbar-color": "rgb(var(--tiny-rgb-neutral-0))",
        }}
      >
        <TableCore.Table>
          <TableCore.Body>
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
          </TableCore.Body>
        </TableCore.Table>
        <div class="absolute top-0 right-0 left-0" ref={setWidthRef} />
      </div>
    </TableCore>
  );
}
