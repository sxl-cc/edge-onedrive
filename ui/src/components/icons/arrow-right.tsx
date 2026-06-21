import { type IconProps, SvgWrapper } from "./common";

export function IconArrowRight(props: IconProps) {
  return (
    <SvgWrapper {...props}>
      <path
        d="m13.172 12l-4.95-4.95l1.414-1.413L16 12l-6.364 6.364l-1.414-1.415z"
        fill="currentColor"
      />
    </SvgWrapper>
  );
}
