import { A, useSearchParams } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { createQuery } from "solid-tiny-query";
import { Button, SpinRing } from "solid-tiny-ui";
import { useTranslator } from "../../../i18n";
import {
  exchangeOneDriveAuthorizationCode,
  ONEDRIVE_AUTH_SESSION_STORAGE_KEY,
  type OneDriveAuthorizationSession,
} from "../../../lib/pkce";

function readAuthorizationSession() {
  try {
    const raw = sessionStorage.getItem(ONEDRIVE_AUTH_SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as OneDriveAuthorizationSession;
  } catch {
    return null;
  }
}

function getFailureReason(
  params: Record<string, unknown>,
  messages: {
    missingCode: string;
  }
) {
  if (params.error_description) {
    return String(params.error_description);
  }

  if (params.error) {
    return String(params.error);
  }

  if (!params.code) {
    return messages.missingCode;
  }

  return "";
}

export default function OneDriveCallbackPage() {
  const [params] = useSearchParams();
  const t = useTranslator();
  const [err, setErr] = createSignal(t("settings.authorizationError"));

  const query = createQuery(
    async () => {
      const failureReason = getFailureReason(params, {
        missingCode: t("settings.authorizationCodeMissing"),
      });

      if (failureReason) {
        throw new Error(failureReason);
      }

      const session = readAuthorizationSession();

      if (!session) {
        throw new Error(t("settings.authorizationSessionMissing"));
      }

      if (params.state !== session.state) {
        throw new Error(t("settings.authorizationStateMismatch"));
      }

      const data = await exchangeOneDriveAuthorizationCode(
        session,
        String(params.code)
      );
      sessionStorage.removeItem(ONEDRIVE_AUTH_SESSION_STORAGE_KEY);
      return data;
    },
    {
      onError(error) {
        if (error instanceof Error) {
          setErr(error.message);
        } else {
          setErr(String(error));
        }
      },
    }
  );

  return (
    <section class="scrollbar h-full overflow-y-auto p-xl">
      <div class="flex h-full w-full flex-col items-center justify-center gap-lg">
        <Show fallback={<SpinRing />} when={!query.isLoading}>
          <Show
            fallback={
              <>
                <p class="c-text-heading fs-lg">
                  {t("settings.oneDriveAuthorization")}
                </p>
                <p class="c-danger-base fs-md">
                  {t("settings.authorizationFailed")}
                </p>
                <p class="fs-sm c-text-description whitespace-pre-wrap">
                  {err()}
                </p>
                <div>
                  <A href="/settings">
                    <Button>{t("settings.backToSettings")}</Button>
                  </A>
                </div>
              </>
            }
            when={query.data && !query.isError}
          >
            <p class="c-text-heading fs-lg">
              {t("settings.oneDriveAuthorization")}
            </p>
            <p class="c-success-base fs-md">
              {t("settings.authorizationSucceeded")}
            </p>
            <p class="c-text-description fs-sm">
              {t("settings.authorizationSucceededDescription")}
            </p>
            <div>
              <A href="/settings">
                <Button>{t("settings.backToSettings")}</Button>
              </A>
            </div>
          </Show>
        </Show>
      </div>
    </section>
  );
}
