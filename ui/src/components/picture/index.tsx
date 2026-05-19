import { combineClass } from "solid-tiny-utils";

export function Picture(props: {
  src: string;
  width: number;
  height: number;
  alt: string;
  class?: string;
}) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: image loaded
    <img
      alt={props.alt}
      class={combineClass("rounded-md object-cover transition", props.class)}
      height={props.height}
      onLoad={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      src={props.src}
      style={{
        opacity: 0,
      }}
      width={props.width}
    />
  );
}
