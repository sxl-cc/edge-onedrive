import { A, useNavigate } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createWatch } from "solid-tiny-utils";
import { useAppState } from "../states/app-state";

export function Layout(props: { children: JSX.Element }) {
  const [state] = useAppState();
  const $n = useNavigate();

  createWatch(
    () => [state.accessToken] as const,
    ([accessToken]) => {
      if (!accessToken) {
        $n("/login");
      }
    }
  );
  return (
    <div class="flex h-screen w-full flex-col lg:mx-auto lg:w-800px">
      <header class="flex h-68px items-end pb-10px">
        <A end href="/v?type=folder">
          <img alt="logo" height="48" src="/logo.png" width="48" />
        </A>
      </header>
      <main class="mica h-[calc(100%-68px)] w-full lg:h-[calc(100%-115px)] lg:rounded-8px">
        {props.children}
      </main>
    </div>
  );
}
