import "./alert.scss";
import { children, createMemo, type JSX, Match, Show, Switch } from "solid-js";
import {
  CloseLine,
  IconCheckboxCircleLine,
  IconErrorWarningLine,
  InformationLine,
} from "../icons";

export type AlertStatus = "success" | "error" | "warning" | "info";
export type AlertVariant = "subtle" | "solid" | "outline";

function AlertIcon(props: { status: AlertStatus }) {
  return (
    <Switch>
      <Match when={props.status === "info"}>
        <InformationLine size="20px" />
      </Match>
      <Match when={props.status === "success"}>
        <IconCheckboxCircleLine size="20px" />
      </Match>
      <Match when={props.status === "error" || props.status === "warning"}>
        <IconErrorWarningLine size="20px" />
      </Match>
    </Switch>
  );
}

export function Alert(props: {
  status?: AlertStatus;
  variant?: AlertVariant;
  title?: JSX.Element;
  description?: JSX.Element;
  children?: JSX.Element;
  icon?: JSX.Element;
  showIcon?: boolean;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const status = () => props.status ?? "info";
  const variant = () => props.variant ?? "subtle";
  const showIcon = () => props.showIcon ?? true;

  const resolvedIcon = children(() => props.icon);
  const resolvedTitle = children(() => props.title);
  const resolvedDescription = children(() => props.description);
  const resolvedChildren = children(() => props.children);

  const hasContent = createMemo(
    () => resolvedTitle() || resolvedDescription() || resolvedChildren()
  );

  return (
    <div
      class="tiny-alert"
      data-status={status()}
      data-variant={variant()}
      role="alert"
    >
      <Show when={showIcon()}>
        <div class="tiny-alert__icon">
          {resolvedIcon() || <AlertIcon status={status()} />}
        </div>
      </Show>

      <Show when={hasContent()}>
        <div class="tiny-alert__content">
          <Show when={resolvedTitle()}>
            <div class="tiny-alert__title">{resolvedTitle()}</div>
          </Show>
          <Show when={resolvedDescription()}>
            <div class="tiny-alert__description">{resolvedDescription()}</div>
          </Show>
          <Show when={resolvedChildren()}>{resolvedChildren()}</Show>
        </div>
      </Show>

      <Show when={props.showClose}>
        <button
          aria-label="Close alert"
          class="tiny-alert__close"
          onClick={props.onClose}
          type="button"
        >
          <CloseLine size="16px" />
        </button>
      </Show>
    </div>
  );
}
