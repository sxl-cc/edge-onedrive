import "./spin.scss";
import { children, createSignal, type JSX, onCleanup, Show } from "solid-js";
import { createPresence, createWatch, dataIf } from "solid-tiny-utils";
import { getAnimationDurationMs } from "./duration";
import { SpinRing } from "./spin-ring";

export function Spin(props: {
  spinning?: boolean;
  children: JSX.Element;
  indicator?: JSX.Element;
  delay?: number;
}) {
  const [spinning, setSpinning] = createSignal(false);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    clearTimeout(timeout);
  });

  createWatch(
    () => props.spinning,
    (v) => {
      clearTimeout(timeout);
      const delay = props.delay ?? 150;
      if (delay > 0) {
        if (v) {
          timeout = setTimeout(() => {
            setSpinning(true);
          }, delay);
        } else {
          setSpinning(false);
        }
      } else {
        setSpinning(!!v);
      }
    }
  );

  const resolvedIndicator = children(() => props.indicator);

  const [refLoader, setRefLoader] = createSignal<HTMLElement>();
  const presence = createPresence(spinning, {
    enterDuration: () => getAnimationDurationMs(refLoader()),
    exitDuration: () => getAnimationDurationMs(refLoader()),
  });
  return (
    <div
      aria-busy={spinning()}
      class="tiny-spin"
      data-spinning={dataIf(spinning())}
    >
      <div class="tiny-spin__content">{props.children}</div>
      <Show when={presence.isMounted()}>
        <div
          class="tiny-spin__loader"
          data-entering={dataIf(
            ["entering", "pre-enter"].includes(presence.phase())
          )}
          data-exiting={dataIf(["exiting"].includes(presence.phase()))}
          ref={setRefLoader}
        >
          <Show fallback={<SpinRing />} when={resolvedIndicator()}>
            {resolvedIndicator()}
          </Show>
        </div>
      </Show>
    </div>
  );
}
