import "./progress.scss";
import { createMemo } from "solid-js";
import { clamp, dataIf } from "solid-tiny-utils";

export function LineProgress(props: {
  percent?: number;
  indeterminate?: boolean;
  fillColor?: string;
  railColor?: string;
  width?: string;
}) {
  const normalizedPercent = createMemo(() => {
    if (props.percent === undefined) {
      return 45;
    }
    return clamp(props.percent, 0, 100);
  });

  const background = createMemo(() => {
    const color = props.fillColor || "rgb(var(--tiny-rgb-brand-5))";
    if (props.indeterminate) {
      return `linear-gradient(90deg, transparent, ${color} 30%, ${color} 65%, transparent)`;
    }

    return color;
  });

  return (
    <div
      aria-valuenow={normalizedPercent()}
      role="progressbar"
      style={{
        height: "3px",
        overflow: "hidden",
        display: "flex",
        "align-items": "center",
        "border-radius": "3px",
        width: props.width || "100%",
      }}
    >
      <div
        class="tiny-progress-line-rail"
        style={{
          height: "1px",
          width: props.width || "100%",
          background: props.railColor || "rgb(var(--tiny-rgb-neutral-3))",
          overflow: "visible",
        }}
      >
        <div
          class="tiny-progress-line-fill"
          data-indeterminate={dataIf(props.indeterminate ?? false)}
          style={{
            width: `${normalizedPercent()}%`,
            height: "3px",
            background: background(),
          }}
        />
      </div>
    </div>
  );
}
