import { type IconProps, SvgWrapper } from "./common";

export function IconArrowLeft(props: IconProps) {
  return (
    <SvgWrapper {...props}>
      <path
        d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"
        fill="currentColor"
      />
    </SvgWrapper>
  );
}
