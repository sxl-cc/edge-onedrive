import { type IconProps, SvgWrapper } from "./common";

export function CheckBold(props: IconProps) {
  return (
    <SvgWrapper {...props}>
      <path
        d="m6 10l-2 2l6 6L20 8l-2-2l-8 8z"
        fill="currentColor"
        fill-rule="evenodd"
      />
    </SvgWrapper>
  );
}
