import routes from "virtual:pages";
import { Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createQueryClient } from "solid-tiny-query";
import { TinyToasterProvider, TinyUiProvider, useToaster } from "solid-tiny-ui";
import { createWatch, makeEventListener } from "solid-tiny-utils";
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
  const [, actions] = useAppState();

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  makeEventListener(mediaQuery, "change", () => {
    actions.setState("themeMediaChanges", (p) => p + 1);
  });

  createWatch(actions.getTheme, (t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
  });

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
