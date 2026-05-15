import { A } from "@solidjs/router";
import { Dynamic } from "solid-js/web";
import type { MsGraphDriveItem } from "~api";
import { normalizeUrlPath } from "../../utils/path";

export function MsDriveItem(props: {
  item: MsGraphDriveItem;
  active: boolean;
  currentPath: string;
  onClick: () => void;
}) {
  const classes = () => {
    const base = ["px-sm"];

    if (props.active) {
      base.push("bg-neutral-2");
    } else {
      base.push("hover:bg-neutral-1");
    }

    return base.join(" ");
  };

  const iconClass = () => {
    const item = props.item;
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

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: <explanation>
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div class={classes()} onClick={props.onClick}>
      <Dynamic
        class="flex items-center gap-sm"
        component={props.active ? A : "div"}
        href={
          props.active
            ? normalizeUrlPath(props.currentPath, props.item.name)
            : undefined
        }
      >
        <div class={iconClass()} />
        <div>{props.item.name}</div>
      </Dynamic>
    </div>
  );
}
