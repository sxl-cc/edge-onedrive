import type { ComponentProps } from "solid-js";
import Colgroup from "./colgroup";

export function TableBody(props: ComponentProps<"tbody">) {
  return (
    <>
      <Colgroup />
      <tbody {...props} />
    </>
  );
}
