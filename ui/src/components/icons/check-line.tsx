import { type IconProps, SvgWrapper } from "./common";

export function CheckLine(props: IconProps) {
  return (
    <SvgWrapper {...props}>
      <path
        d="m10 15.17l9.192-9.191l1.414 1.414L10 17.999l-6.364-6.364l1.414-1.414z"
        fill="currentColor"
      />
    </SvgWrapper>
  );
}
