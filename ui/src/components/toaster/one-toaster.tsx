import { children, createSignal, onMount, Show } from "solid-js";
import {
  callMaybeCallableChild,
  createPresence,
  createWatch,
  dataIf,
} from "solid-tiny-utils";
import { context } from "./context";
import { ToasterIcon } from "./icon";
import type { Toast } from "./type";

function HiddenAutoDismiss(props: {
  duration: number;
  pause: boolean;
  onEnd: () => void;
}) {
  let ref!: HTMLDivElement;

  onMount(() => {
    // reflow
    // biome-ignore lint/suspicious/noUnusedExpressions: reflow
    ref.offsetHeight;

    createWatch(
      () => [props.duration, props.pause] as const,
      ([duration, pause], prevInput) => {
        if (prevInput) {
          const [prevDuration] = prevInput;
          if (duration !== prevDuration) {
            ref.style.width = "100%";
          }
        }
        // biome-ignore lint/style/noNonNullAssertion: safe
        const percent = ref.offsetWidth / ref.parentElement!.offsetWidth;

        if (percent === 0 && duration > 0) {
          props.onEnd();
          return;
        }

        if (pause) {
          ref.style.width = `${percent * 100}%`;
          ref.style.transition = "none";
        } else {
          ref.style.width = "0";
          ref.style.transition = `width ${duration * percent}ms linear`;
        }
      }
    );
  });

  return (
    <div
      onTransitionEnd={props.onEnd}
      ref={ref}
      style={{
        width: "100%",
        position: "absolute",
      }}
    />
  );
}

function getElRealHeight(el: HTMLDivElement) {
  const prevAnimationName = el.style.animationName;
  el.style.animationName = "none";
  const height = el.offsetHeight;
  el.style.animationName = prevAnimationName;
  return height;
}

export function OneToaster(props: Toast) {
  const [state, actions] = context.useContext();
  const [show, setShow] = createSignal(true);

  const [height, setHeight] = createSignal(0);

  const presence = createPresence(show, {
    enterDuration: 400,
    exitDuration: 350,
    initialEnter: true,
  });

  createWatch(presence.isMounted, (shouldMount) => {
    if (!shouldMount) {
      actions.removeToast(props.id);
    }
  });

  createWatch(
    () => state.dismissSignal[props.id],
    (signal) => {
      if (signal) {
        setShow(false);
      }
    }
  );

  let ref!: HTMLDivElement;

  onMount(() => {
    createWatch(presence.phase, (phase) => {
      if (["entering", "exiting"].includes(phase)) {
        const elHeight = getElRealHeight(ref);
        setHeight(elHeight);
      }
    });
  });

  const icon = children(() =>
    callMaybeCallableChild(props.icon, {
      id: props.id,
      type: props.type,
      duration: props.duration,
      position: props.position,
    })
  );

  return (
    <Show when={presence.isMounted()}>
      <div
        class="tiny-toast-wrapper"
        data-entering={dataIf(
          ["entering", "pre-enter"].includes(presence.phase())
        )}
        data-exiting={dataIf(["exiting"].includes(presence.phase()))}
        data-presence-phase={presence.phase()}
        onMouseEnter={() => {
          actions.setState("pauseRemoval", true);
        }}
        onMouseLeave={() => {
          actions.setState("pauseRemoval", false);
        }}
        ref={ref}
        role="presentation"
        style={{
          "--height": `${height()}px`,
        }}
      >
        <div
          class="tiny-toast"
          data-type={props.type}
          style={{
            "--from-y": props.position.startsWith("top") ? "-20%" : "20%",
          }}
        >
          <Show
            when={
              icon() ||
              ["info", "success", "warning", "error", "loading"].includes(
                props.type
              )
            }
          >
            <div class="tiny-toast__icon">
              {icon() || <ToasterIcon type={props.type} />}
            </div>
          </Show>
          <div class="tiny-toast__content">
            {callMaybeCallableChild(props.message, {
              id: props.id,
              type: props.type,
              duration: props.duration,
              position: props.position,
            })}
          </div>
        </div>
        <HiddenAutoDismiss
          duration={props.duration}
          onEnd={() => {
            setShow(false);
          }}
          pause={state.pauseRemoval}
        />
      </div>
    </Show>
  );
}
