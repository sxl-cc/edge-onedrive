import type { JSX } from "solid-js";

export function Layout(props: { children: JSX.Element }) {
  return (
    <div class="scrollbar flex h-screen w-full flex-col lg:mx-auto lg:w-800px">
      <header class="h-60px w-full">edge-onedrive</header>
      <main class="scrollbar w-full flex-1 overflow-auto">
        {props.children}
      </main>
    </div>
  );
}
