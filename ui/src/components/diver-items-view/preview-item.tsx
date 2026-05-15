import { Show } from "solid-js";
import type { MsGraphDriveItem } from "~api";

export function PreviewItem(props: { item?: MsGraphDriveItem | null }) {
  return (
    <div class="flex w-full flex-col items-center justify-center">
      <Show when={props.item}>
        <pre class="whitespace-break-spaces break-words">
          {JSON.stringify(props.item, null, 2)}
        </pre>
      </Show>
    </div>
  );
}
