import { useNavigate } from "@solidjs/router";
import { createEffect, createResource, createSignal, Show } from "solid-js";
import {
  Button,
  Field,
  PasswordInput,
  Spin,
  TextField,
  useToaster,
} from "solid-tiny-ui";
import { useTranslator } from "../../i18n";
import { useAppState } from "../../states/app-state";
import { req } from "../../utils/req";

async function isPasswordSetup() {
  const res = await req.get<{
    is_setup: boolean;
  }>("/api/v1/auth/setup");

  return res.is_setup;
}

async function setupPassword(username: string, password: string) {
  await req.post("/api/v1/auth/setup", {
    username,
    password,
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export default function LoginPage() {
  const [state, acts] = useAppState();
  const navigate = useNavigate();
  const toaster = useToaster();
  const t = useTranslator();
  const [setupReady] = createResource(isPasswordSetup);
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const isSetupMode = () => setupReady() === false;

  createEffect(() => {
    if (state.accessToken) {
      navigate("/v/", { replace: true });
    }
  });

  const submit = async () => {
    const name = username().trim();
    const pwd = password();

    if (name.length < 4) {
      toaster.error(t("login.usernameMinError"));
      return;
    }

    if (pwd.length < 9) {
      toaster.error(t("login.passwordMinError"));
      return;
    }

    if (isSetupMode() && pwd !== confirmPassword()) {
      toaster.error(t("login.passwordMismatchError"));
      return;
    }

    setSubmitting(true);

    try {
      if (isSetupMode()) {
        await setupPassword(name, pwd);
        toaster.success(t("login.setupSuccess"));
        await acts.login(name, pwd);
        navigate("/settings", { replace: true });
        return;
      }

      await acts.login(name, pwd);
      navigate("/v?type=folder", { replace: true });
    } catch (error) {
      toaster.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section class="h-full w-full p-lg">
      <Spin
        classNames={{
          root: "w-full",
        }}
        spinning={setupReady.loading}
      >
        <form
          class="w-full p-xl"
          onSubmit={async (event) => {
            event.preventDefault();
            await submit();
          }}
        >
          <div class="mb-xl">
            <p class="fs-xs m-0 text-neutral-6 uppercase tracking-[0.18em]">
              Edge OneDrive
            </p>
            <h1 class="fs-xl c-text-heading m-0 mt-sm font-700">
              {isSetupMode() ? t("login.setup") : t("login.login")}
            </h1>
            <p class="c-neutral-7 fs-sm m-0 mt-sm leading-6">
              {isSetupMode()
                ? t("login.setupDescription")
                : t("login.loginDescription")}
            </p>
          </div>

          <div class="flex flex-col gap-xl">
            <Field>
              <Field.Title>{t("login.username")}</Field.Title>
              <Field.RequiredIndicator />
              <TextField
                disabled={submitting()}
                name="username"
                onChange={setUsername}
                placeholder="admin"
                size="large"
                value={username()}
              />
            </Field>

            <Field>
              <Field.Title>{t("login.password")}</Field.Title>
              <Field.RequiredIndicator />
              <PasswordInput
                disabled={submitting()}
                name="password"
                onChange={setPassword}
                size="large"
                value={password()}
              />
            </Field>

            <Show when={isSetupMode()}>
              <Field>
                <Field.Title>{t("login.confirmPassword")}</Field.Title>
                <Field.RequiredIndicator />
                <PasswordInput
                  disabled={submitting()}
                  name="confirm_password"
                  onChange={setConfirmPassword}
                  size="large"
                  value={confirmPassword()}
                />
              </Field>
            </Show>

            <Button loading={submitting()} size="large" type="submit">
              {isSetupMode() ? t("login.setupAndLogin") : t("login.login")}
            </Button>
          </div>
        </form>
      </Spin>
    </section>
  );
}
