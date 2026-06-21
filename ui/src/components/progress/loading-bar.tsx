import { createSignal } from "solid-js";
import { createLoopExec, createWatch } from "solid-tiny-utils";
import { LineProgress } from "./line-progress";

/**
 * A loading bar component based on line-progress.
 *
 * It will infinitely load when `open` is true.
 */
export function LoadingBar(props: { open: boolean }) {
  const [percent, setPercent] = createSignal(0);

  const speed = 0.03;

  const { start, stop } = createLoopExec(() => {
    setPercent((p) => {
      const next = p + (100 - p) * speed;
      return next > 99.9 ? 99.9 : next;
    });
  }, 100);

  createWatch(
    () => props.open,
    (open) => {
      if (open) {
        setPercent(0);
        start();
      } else {
        stop();
        setPercent(100);
      }
    }
  );

  return (
    <div
      style={{
        "pointer-events": "none",
        opacity: props.open ? 1 : 0,
        transition: "opacity 0.3s ease 100ms",
      }}
    >
      <LineProgress percent={percent()} railColor="transparent" />
    </div>
  );
}
