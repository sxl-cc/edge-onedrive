import routes from "virtual:pages";
import { Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createQueryClient } from "solid-tiny-query";
import { createWatch } from "solid-tiny-utils";
import { TinyUiProvider } from "./components/root-provider";
import { TinyToasterProvider, useToaster } from "./components/toaster";
import type { Dictionary } from "./i18n";
import { Layout } from "./parts/layout";
import { useAppState } from "./states/app-state";

function QueryClientProvider(props: {
  children: JSX.Element;
  dict?: Dictionary;
  locale?: string;
}) {
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

  const [, actions] = queryClient.value;
  if (props.dict && props.locale) {
    actions.setCache(["i18n", props.locale], props.dict);
  }

  return <queryClient.Provider>{props.children}</queryClient.Provider>;
}

export function App(props: { dict?: Dictionary; locale?: string }) {
  const [state] = useAppState();

  createWatch(
    () => state.theme,
    (t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
    }
  );

  return (
    <Router
      root={(c) => (
        <TinyUiProvider hue={248}>
          <TinyToasterProvider>
            <QueryClientProvider dict={props.dict} locale={props.locale}>
              <Layout>{c.children}</Layout>
            </QueryClientProvider>
          </TinyToasterProvider>
        </TinyUiProvider>
      )}
    >
      {routes}
    </Router>
  );
}
