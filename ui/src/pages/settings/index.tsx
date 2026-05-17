import { createEffect, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { createQuery } from "solid-tiny-query";
import {
  Button,
  Field,
  PasswordInput,
  SpinRing,
  Textarea,
  TextField,
  useToaster,
} from "solid-tiny-ui";
import { useTranslator } from "../../i18n";
import { req } from "../../utils/req";

interface AuthSettingsState {
  has_api_key: boolean;
  has_ms_graph_refresh_token: boolean;
  username: string;
}

interface SettingsFormState {
  confirmPassword: string;
  generatingKey: boolean;
  newApiKey: string;
  password: string;
  refreshToken: string;
  savingLogin: boolean;
  savingRefreshToken: boolean;
  username: string;
}

async function getAuthSettings() {
  return await req.get<AuthSettingsState>("/api/v1/auth/settings");
}

async function updateLoginInfo(username: string, password: string) {
  await req.post("/api/v1/auth/change-login-info", {
    username,
    password,
  });
}

async function updateMsGraphRefreshToken(refreshToken: string) {
  await req.post("/api/v1/auth/ms-graph-refresh-token", {
    refresh_token: refreshToken,
  });
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
  const query = createQuery({
    queryKey: () => ["auth-settings"],
    queryFn: getAuthSettings,
    staleTime: 0,
  });
  const [form, setForm] = createStore<SettingsFormState>({
    username: "",
    password: "",
    confirmPassword: "",
    refreshToken: "",
    newApiKey: "",
    savingLogin: false,
    savingRefreshToken: false,
    generatingKey: false,
  });

  createEffect(() => {
    const username = query.data?.username;
    if (username && !form.username) {
      setForm("username", username);
    }
  });

  const saveLoginInfo = async () => {
    const username = form.username.trim();
    const password = form.password;

    if (username.length < 4) {
      toaster.error(t("settings.usernameMinError"));
      return;
    }

    if (password.length < 9) {
      toaster.error(t("settings.passwordMinError"));
      return;
    }

    if (password !== form.confirmPassword) {
      toaster.error(t("settings.passwordMismatchError"));
      return;
    }

    setForm("savingLogin", true);

    try {
      await updateLoginInfo(username, password);
      setForm({
        username,
        password: "",
        confirmPassword: "",
      });
      await query.refetch();
      toaster.success(t("settings.loginSaved"));
    } catch (error) {
      toaster.error(getErrorMessage(error));
    } finally {
      setForm("savingLogin", false);
    }
  };

  const saveRefreshToken = async () => {
    const token = form.refreshToken.trim();

    if (!token) {
      toaster.error(t("settings.refreshTokenRequired"));
      return;
    }

    setForm("savingRefreshToken", true);

    try {
      await updateMsGraphRefreshToken(token);
      setForm("refreshToken", "");
      await query.refetch();
      toaster.success(t("settings.refreshTokenSaved"));
    } catch (error) {
      toaster.error(getErrorMessage(error));
    } finally {
      setForm("savingRefreshToken", false);
    }
  };

  const generateApiKey = async () => {
    setForm("generatingKey", true);

    try {
      const data = await createApiKey();
      setForm("newApiKey", data.key);
      await query.refetch();
      toaster.success(t("settings.apiKeyGenerated"));
    } catch (error) {
      toaster.error(getErrorMessage(error));
    } finally {
      setForm("generatingKey", false);
    }
  };

  const copyApiKey = async () => {
    if (!form.newApiKey) {
      return;
    }

    await navigator.clipboard.writeText(form.newApiKey);
    toaster.success(t("settings.apiKeyCopied"));
  };

  return (
    <section class="scrollbar h-full overflow-y-auto p-xl">
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
            <p class="fs-lg c-text-heading m-0">{t("global.settings")}</p>
            <p class="m-0 mt-sm text-neutral-7 text-sm leading-6">
              {t("settings.description")}
            </p>
          </header>

          <form
            class="mb-3xl"
            onSubmit={async (event) => {
              event.preventDefault();
              await saveLoginInfo();
            }}
          >
            <div class="grid gap-lg">
              <Field>
                <Field.Title>{t("settings.username")}</Field.Title>
                <TextField
                  disabled={form.savingLogin || query.isLoading}
                  onChange={(value) => setForm("username", value)}
                  placeholder="admin"
                  size="large"
                  value={form.username}
                />
              </Field>

              <Field>
                <Field.Title>{t("settings.newPassword")}</Field.Title>
                <PasswordInput
                  disabled={form.savingLogin}
                  onChange={(value) => setForm("password", value)}
                  placeholder={t("settings.passwordPlaceholder")}
                  size="large"
                  value={form.password}
                />
              </Field>

              <Field>
                <Field.Title>{t("settings.confirmPassword")}</Field.Title>
                <PasswordInput
                  disabled={form.savingLogin}
                  onChange={(value) => setForm("confirmPassword", value)}
                  placeholder={t("settings.confirmPasswordPlaceholder")}
                  size="large"
                  value={form.confirmPassword}
                />
              </Field>

              <div>
                <Button loading={form.savingLogin} type="submit">
                  {t("settings.saveLogin")}
                </Button>
              </div>
            </div>
          </form>

          <form
            class="mb-3xl"
            onSubmit={async (event) => {
              event.preventDefault();
              await saveRefreshToken();
            }}
          >
            <Field>
              <Field.Title align="center">
                <div>{t("settings.msGraphRefreshToken")}</div>
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
                {t("settings.refreshTokenDescription")}
              </Field.Description>
              <Textarea
                autosize
                disabled={form.savingRefreshToken}
                onChange={(value) => setForm("refreshToken", value)}
                placeholder={t("settings.refreshTokenPlaceholder")}
                rows={4}
                value={form.refreshToken}
              />
              <div class="mt-lg">
                <Button loading={form.savingRefreshToken} type="submit">
                  {t("settings.saveRefreshToken")}
                </Button>
              </div>
            </Field>
          </form>

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
                <Button loading={form.generatingKey} onClick={generateApiKey}>
                  {t("settings.generateApiKey")}
                </Button>
                <Show when={form.newApiKey}>
                  <Button onClick={copyApiKey} variant="outline">
                    {t("settings.copy")}
                  </Button>
                </Show>
              </div>

              <Show when={form.newApiKey}>
                <pre class="m-0 mt-lg overflow-x-auto rounded-5 bg-neutral-1 p-md text-neutral-9 text-sm leading-6">
                  {form.newApiKey}
                </pre>
              </Show>
            </div>
          </section>
        </div>
      </Show>
    </section>
  );
}
