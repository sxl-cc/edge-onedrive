import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { createStore } from "solid-js/store";
import { createQuery } from "solid-tiny-query";
import { Button } from "../../components/button";
import { Field } from "../../components/field";
import { Combobox } from "../../components/form-components";
import { SpinRing } from "../../components/spin";
import { useToaster } from "../../components/toaster";
import { type Locale, useTranslator } from "../../i18n";
import {
  createOneDriveAuthorizationRequest,
  ONEDRIVE_AUTH_SESSION_STORAGE_KEY,
} from "../../lib/pkce";
import { useAppState } from "../../states/app-state";
import { req } from "../../utils/req";
import { LoginChanger } from "./login-changer";

interface AuthSettingsState {
  has_api_key: boolean;
  has_ms_graph_refresh_token: boolean;
  username: string;
}

type LocaleSetting = Locale | "auto";
type ThemeSetting = "auto" | "light" | "dark";

interface SettingsOption<T extends string> {
  label: string;
  value: T;
}

async function getAuthSettings() {
  return await req.get<AuthSettingsState>("/api/v1/auth/settings");
}

async function createApiKey() {
  return await req.post<{ key: string }>("/api/v1/auth/new-key");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function StatusPill(props: { active: boolean; label: string }) {
  return (
    <span
      class={`inline-flex items-center gap-xs rounded-full px-sm py-3px font-600 text-12px ${
        props.active
          ? "c-success-fg bg-success-surface"
          : "bg-neutral-2 text-neutral-7"
      }`}
    >
      <span
        class={`h-7px w-7px rounded-full ${
          props.active ? "bg-success-base" : "bg-neutral-5"
        }`}
      />
      {props.label}
    </span>
  );
}

export default function SettingsPage() {
  const toaster = useToaster();
  const t = useTranslator();
  const [appState, appActions] = useAppState();
  const query = createQuery(getAuthSettings);
  const [form, setForm] = createStore({
    newApiKey: "",
    savingLogin: false,
  });

  const generateApiKey = async () => {
    try {
      const data = await createApiKey();
      setForm("newApiKey", data.key);
      await query.refetch();
      toaster.success(t("settings.apiKeyGenerated"));
    } catch (error) {
      toaster.error(getErrorMessage(error));
    }
  };

  const copyApiKey = async () => {
    if (!form.newApiKey) {
      return;
    }

    await navigator.clipboard.writeText(form.newApiKey);
    toaster.success(t("settings.apiKeyCopied"));
  };

  const beginOneDriveAuthorization = async () => {
    try {
      const { authorizationUrl, sessionState } =
        await createOneDriveAuthorizationRequest();
      sessionStorage.setItem(
        ONEDRIVE_AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(sessionState)
      );
      window.location.href = authorizationUrl;
    } catch (error) {
      toaster.error(getErrorMessage(error));
    }
  };

  const languageOptions = (): SettingsOption<LocaleSetting>[] => [
    { label: "auto", value: "auto" },
    { label: "en", value: "en" },
    { label: "zh-cn", value: "zh-cn" },
  ];

  const themeOptions = (): SettingsOption<ThemeSetting>[] => [
    { label: "auto", value: "auto" },
    { label: "light", value: "light" },
    { label: "dark", value: "dark" },
  ];

  const $n = useNavigate();

  return (
    <section class="relative h-full">
      <div class="absolute top-[-42px] right-4px flex items-start justify-end gap-4px">
        <Button
          onClick={() => {
            $n(-1);
          }}
          variant="text"
        >
          <div class="i-ri:arrow-up-line c-text-label text-20px" />
        </Button>
      </div>
      <div class="scrollbar h-full w-full overflow-y-auto p-xl">
        <Show
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <SpinRing />
            </div>
          }
          when={!query.isLoading}
        >
          <div class="flex w-full flex-col">
            <header class="mb-xl pt-md">
              <p class="fs-xs c-neutral-6 m-0 uppercase tracking-[0.18em]">
                Edge OneDrive
              </p>
              <p class="fs-xl c-text-heading m-0 mt-sm font-700">
                {t("global.settings")}
              </p>
              <p class="c-neutral-7 fs-sm m-0 mt-sm leading-6">
                {t("settings.description")}
              </p>
            </header>

            <section class="mb-3xl grid gap-lg md:grid-cols-2">
              <Field>
                <Field.Title>{t("settings.language")}</Field.Title>
                <Combobox<SettingsOption<LocaleSetting>>
                  onChange={(value) =>
                    appActions.setState("locale", value as LocaleSetting)
                  }
                  options={languageOptions()}
                  size="large"
                  value={appState.locale}
                />
              </Field>

              <Field>
                <Field.Title>{t("settings.theme")}</Field.Title>
                <Combobox<SettingsOption<ThemeSetting>>
                  onChange={(value) =>
                    appActions.setState("theme", value as ThemeSetting)
                  }
                  options={themeOptions()}
                  size="large"
                  value={appState.theme}
                />
              </Field>
            </section>

            <LoginChanger
              class="mb-3xl flex flex-col gap-lg"
              username={query.data?.username || ""}
            />

            <section class="mb-3xl">
              <Field>
                <Field.Title align="center">
                  <div>{t("settings.oneDriveAuthorization")}</div>
                  <StatusPill
                    active={Boolean(query.data?.has_ms_graph_refresh_token)}
                    label={
                      query.data?.has_ms_graph_refresh_token
                        ? t("settings.configured")
                        : t("settings.notConfigured")
                    }
                  />
                </Field.Title>
                <Field.Description>
                  {t("settings.oneDriveAuthorizationDescription")}
                </Field.Description>
                <div class="mt-lg">
                  <Button onClick={beginOneDriveAuthorization}>
                    {t("settings.authorizeOneDrive")}
                  </Button>
                </div>
              </Field>
            </section>

            <section>
              <Field>
                <Field.Title align="center">
                  <div>{t("settings.apiKey")}</div>
                  <StatusPill
                    active={Boolean(query.data?.has_api_key)}
                    label={
                      query.data?.has_api_key
                        ? t("settings.configured")
                        : t("settings.notConfigured")
                    }
                  />
                </Field.Title>
                <Field.Description>
                  {t("settings.apiKeyDescription")}
                </Field.Description>
              </Field>

              <div class="mt-lg">
                <div class="flex flex-wrap items-center gap-md">
                  <Button onClick={generateApiKey}>
                    {t("settings.generateApiKey")}
                  </Button>
                  <Show when={form.newApiKey}>
                    <Button onClick={copyApiKey}>{t("settings.copy")}</Button>
                  </Show>
                </div>

                <Show when={form.newApiKey}>
                  <pre class="c-neutral-9 fs-sm m-0 mt-lg overflow-x-auto rounded-5 bg-neutral-1/40 p-md">
                    {form.newApiKey}
                  </pre>
                </Show>
              </div>
            </section>
          </div>
        </Show>
      </div>
    </section>
  );
}
