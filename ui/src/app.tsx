import routes from "virtual:pages";
import { Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createQueryClient } from "solid-tiny-query";
import { TinyToasterProvider, TinyUiProvider } from "solid-tiny-ui";
import { Layout } from "./parts/layout";

function QueryClientProvider(props: { children: JSX.Element }) {
  const queryClient = createQueryClient();
  return <queryClient.Provider>{props.children}</queryClient.Provider>;
}

export function App() {
  return (
    <Router
      root={(props) => (
        <TinyUiProvider hue={190}>
          <TinyToasterProvider>
            <QueryClientProvider>
              <Layout>{props.children}</Layout>
            </QueryClientProvider>
          </TinyToasterProvider>
        </TinyUiProvider>
      )}
    >
      {routes}
    </Router>
  );
}
