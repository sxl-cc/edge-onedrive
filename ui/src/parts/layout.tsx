import type { JSX } from "solid-js";

export function Layout(props: { children: JSX.Element }) {
  return (
    <div class="flex h-90vh w-full flex-col lg:mx-auto lg:w-800px">
      <header class="w-full pt-10px pb-10px">
        <img alt="logo" height="48" src="/logo.png" width="48" />
      </header>
      <main class="mica w-full flex-1 overflow-hidden lg:rounded-8px">
        {props.children}
      </main>
    </div>
  );
}
