import { createMemo, Show } from "solid-js";
import { combineClass } from "solid-tiny-utils";
import { formatToDateTime } from "time-core";
import type { MsGraphDriveItemFile, MsGraphDriveItemImage } from "~api";
import { useTranslator } from "../../i18n";
import { sizeToString } from "../../utils/size";
import { getDriveItemIconClass } from "../diver-items-view/item-icon-cls";
import { Picture } from "../picture";

function Skeleton() {
  return (
    <>
      <div class="h-80px w-80px animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      <div class="h-30px w-200px animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      <div class="h-24px w-120px animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
      <div class="h-32px w-100px animate-duration-1000 animate-pulse rounded-md bg-neutral-3/60" />
    </>
  );
}

export function MsDriveItem(props: {
  downloadHref?: string;
  item?: MsGraphDriveItemFile | MsGraphDriveItemImage;
  loading: boolean;
}) {
  const t = useTranslator();

  const isImage = createMemo(() => {
    if (props.item && "thumbnail" in props.item) {
      return props.item.thumbnail;
    }
  });

  return (
    <div class="flex w-full flex-col items-center justify-center gap-lg">
      <Show fallback={<Skeleton />} when={!props.loading && props.item}>
        <div class="relative">
          <div
            class={combineClass(
              getDriveItemIconClass(props.item!),
              "text-70px"
            )}
          />
          <div class="absolute inset-0">
            <Show when={isImage()}>
              {(img) => (
                <Picture
                  alt="thumbnail"
                  class="h-full w-full"
                  height={img().height}
                  src={img().url}
                  width={img().width}
                />
              )}
            </Show>
          </div>
        </div>

        <div class="fs-lg c-text-heading">{props.item!.name}</div>
        <div class="fs-sm c-text-description">
          {sizeToString(props.item!.size)} -{" "}
          {formatToDateTime(props.item!.created_at)}
        </div>
        <div>
          <a
            class="c-neutral-0 block flex h-32px min-w-120px items-center justify-center rounded-4px bg-neutral-9"
            download={props.item!.name}
            href={props.downloadHref || props.item!.download_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("global.download")}
          </a>
        </div>
      </Show>
    </div>
  );
}
