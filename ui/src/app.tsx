import routes from "virtual:pages";
import { Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createQueryClient } from "solid-tiny-query";
import { TinyToasterProvider, TinyUiProvider, useToaster } from "solid-tiny-ui";
import { Layout } from "./parts/layout";

function QueryClientProvider(props: { children: JSX.Element }) {
  const toaster = useToaster();
  const queryClient = createQueryClient({
    onError(error) {
      if (error instanceof Error) {
        toaster.error(error.message);
      } else {
        toaster.error(String(error));
      }
    },
  });
  return <queryClient.Provider>{props.children}</queryClient.Provider>;
}

export function App() {
  return (
    <Router
      root={(props) => (
        <TinyUiProvider hue={200}>
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
