import { Match, Switch } from "solid-js";
import {
  IconCheckboxCircleLine,
  IconErrorWarningLine,
  IconLoading,
  InformationLine,
} from "../icons";
import type { ToastType } from "./type";

export function ToasterIcon(props: { type: ToastType }) {
  return (
    <Switch>
      <Match when={props.type === "info"}>
        <InformationLine size="20px" />
      </Match>
      <Match when={props.type === "success"}>
        <IconCheckboxCircleLine size="20px" />
      </Match>
      <Match when={props.type === "error" || props.type === "warning"}>
        <IconErrorWarningLine size="20px" />
      </Match>
      <Match when={props.type === "loading"}>
        <IconLoading size="20px" />
      </Match>
    </Switch>
  );
}
