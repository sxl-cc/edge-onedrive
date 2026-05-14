import { A, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";
import { Button, Spin } from "solid-tiny-ui";
import {
  exchangeAuthorizationCode,
  type OAuthDebugSession,
  PKCE_SESSION_STORAGE_KEY,
} from "../../../lib/pkce";

function readPkceSession() {
  try {
    const raw = sessionStorage.getItem(PKCE_SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as OAuthDebugSession;
  } catch {
    return null;
  }
}

export default function PkceCallbackPage() {
  const [params] = useSearchParams();
  const [sessionState] = createSignal(readPkceSession());

  const [tokenResult] = createResource(() => {
    if (params.error) {
      throw new Error("error");
    }

    if (!params.code) {
      throw new Error("Missing authorization code");
    }

    const session = sessionState();

    if (!session) {
      throw new Error(
        "Missing OAuth debug session. Start from the debug page."
      );
    }

    if (params.state !== session.state) {
      throw new Error("State mismatch. Cancel and restart the OAuth flow.");
    }

    return exchangeAuthorizationCode(session, `${params.code}`);
  });

  const copyJson = async () => {
    const data = tokenResult();

    if (!data) {
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <section class="mx-auto max-w-4xl rounded-6 bg-white p-xl shadow-sm ring-1 ring-black/5">
      <div class="mb-xl flex flex-col gap-sm">
        <p class="m-0 text-12px text-neutral-6 uppercase tracking-[0.18em]">
          OAuth Callback
        </p>
        <h2 class="m-0 font-700 text-3xl text-neutral-12">
          Authorization code exchange result
        </h2>
        <p class="m-0 text-base text-neutral-7 leading-7">
          If the app registration, scopes, secret, and redirect URI are all
          correct, the token payload below should include a{" "}
          <code>refresh_token</code>.
        </p>
      </div>

      <Spin spinning={tokenResult.loading}>
        <Show
          fallback={
            <div class="rounded-5 bg-red-50 p-lg text-red-800 ring-1 ring-red-100">
              <p class="m-0 font-600 text-sm">Exchange failed</p>
              <p class="m-0 mt-sm whitespace-pre-wrap text-sm leading-6">
                {tokenResult.error instanceof Error
                  ? tokenResult.error.message
                  : String(tokenResult.error)}
              </p>
            </div>
          }
          when={tokenResult() && !tokenResult.error}
        >
          <div class="grid gap-lg">
            <div class="flex flex-wrap items-center gap-md">
              <Button onClick={copyJson}>Copy JSON</Button>
              <A
                class="text-sm text-teal-700 hover:text-teal-800"
                href="/debug/pkce"
              >
                Start again
              </A>
            </div>

            <pre class="m-0 overflow-x-auto rounded-5 bg-neutral-1 p-lg text-neutral-8 text-sm leading-6">
              {JSON.stringify(tokenResult(), null, 2)}
            </pre>
          </div>
        </Show>
      </Spin>
    </section>
  );
}
