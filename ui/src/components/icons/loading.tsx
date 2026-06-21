import { type IconProps, SvgWrapper } from "./common";

/**
 * loading icon from [EOS Icons](https://gitlab.com/SUSE-UIUX/eos-icons)
 *
 * [MIT LICENSE](https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE)
 */
export function IconLoading(props: IconProps) {
  return (
    <SvgWrapper {...props}>
      <path
        d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"
        fill="currentColor"
      >
        <animateTransform
          attributeName="transform"
          dur="1s"
          from="0 12 12"
          repeatCount="indefinite"
          to="360 12 12"
          type="rotate"
        />
      </path>
    </SvgWrapper>
  );
}
