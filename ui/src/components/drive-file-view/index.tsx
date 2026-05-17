import { Show } from "solid-js";
import { combineClass } from "solid-tiny-utils";
import { formatToDateTime } from "time-core";
import type { MsGraphDriveItem, MsGraphDriveItemFolder } from "~api";
import { useTranslator } from "../../i18n";
import { sizeToString } from "../../utils/size";
import { getDriveItemIconClass } from "../diver-items-view/item-icon-cls";

function Skeleton() {
  return (
    <>
      <div class="h-80px w-80px animate-duration-1000 animate-pulse rounded-md bg-neutral-1" />
      <div class="h-30px w-200px animate-duration-1000 animate-pulse rounded-md bg-neutral-1" />
      <div class="h-24px w-120px animate-duration-1000 animate-pulse rounded-md bg-neutral-1" />
      <div class="h-32px w-100px animate-duration-1000 animate-pulse rounded-md bg-neutral-1" />
    </>
  );
}

export function MsDriveItem(props: {
  item?: Exclude<MsGraphDriveItem, MsGraphDriveItemFolder>;
  loading: boolean;
}) {
  const t = useTranslator();
  return (
    <div class="flex w-full flex-col items-center justify-center gap-lg">
      <Show fallback={<Skeleton />} when={!props.loading && props.item}>
        <div
          class={combineClass(getDriveItemIconClass(props.item!), "text-70px")}
        />
        <div class="fs-lg c-text-heading">{props.item!.name}</div>
        <div class="fs-sm c-text-description">
          {sizeToString(props.item!.size)} -{" "}
          {formatToDateTime(props.item!.created_at)}
        </div>
        <div>
          <a
            class="c-neutral-0 block flex h-32px min-w-120px items-center justify-center rounded-4px bg-neutral-9"
            download={props.item!.name}
            href={props.item!.download_url}
          >
            {t("global.download")}
          </a>
        </div>
      </Show>
    </div>
  );
}
