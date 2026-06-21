import "./spin-ring.scss";
import { createMemo, mergeProps } from "solid-js";

export function SpinRing(props: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const real = mergeProps(
    {
      size: 32,
      color: "rgb(--tiny-rgb-brand-5)",
      strokeWidth: 12,
    },
    props
  );

  const viewBoxSize = 100;
  const viewBoxPadding = 5;
  const center = viewBoxSize / 2;
  const radius = createMemo(() => {
    const stroke = real.strokeWidth;
    return (viewBoxSize - stroke - viewBoxPadding * 2) / 2;
  });

  return (
    <div
      style={{
        width: `${real.size}px`,
        height: `${real.size}px`,
        color: real.color,
        display: "inline-flex",
      }}
    >
      <svg
        aria-label="progress"
        height={"100%"}
        role="img"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={"100%"}
      >
        <circle
          class="tiny-spinner-indicator"
          cx={center}
          cy={center}
          r={radius()}
          stroke-width={real.strokeWidth}
          style={{
            "--circumference-value": `${2 * Math.PI * radius()}px`,
          }}
        />
      </svg>
    </div>
  );
}
