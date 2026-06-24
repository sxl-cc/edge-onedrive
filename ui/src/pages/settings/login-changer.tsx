import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { createStaticStore, createWatch } from "solid-tiny-utils";
import { Button } from "../../components/button";
import { Field } from "../../components/field";
import { PasswordInput, TextField } from "../../components/form-components";
import { useToaster } from "../../components/toaster";
import { useTranslator } from "../../i18n";
import { useAppState } from "../../states/app-state";
import { req } from "../../utils/req";

async function updateLoginInfo(
  username: string,
  old_password: string,
  new_password: string
) {
  await req.post("/api/v1/auth/change-login-info", {
    username,
    old_password,
    new_password,
  });
}

export function LoginChanger(props: { username: string; class: string }) {
  const t = useTranslator();
  const $t = useToaster();
  const $n = useNavigate();
  const [, act] = useAppState();
  const [loginInfo, setLoginInfo] = createStaticStore({
    username: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
    edit_mode: false,
  });

  createWatch(
    () => props.username,
    (username) => {
      setLoginInfo({ username });
    }
  );

  const handleSave = async () => {
    if (loginInfo.new_password !== loginInfo.confirm_password) {
      $t.error(t("settings.passwordMismatchError"));
      return;
    }
    try {
      await updateLoginInfo(
        loginInfo.username,
        loginInfo.old_password,
        loginInfo.new_password
      );
      setLoginInfo("edit_mode", false);
      $t.success(t("settings.loginSaved"));
      act.logout();
      $n("/login");
    } catch (e: unknown) {
      if (e instanceof Error) {
        $t.error(e.message);
      }
    }
  };

  return (
    <div class={props.class}>
      <Field>
        <Field.Title>{t("settings.username")}</Field.Title>
        <TextField
          onChange={(v) => setLoginInfo("username", v)}
          placeholder="admin"
          readOnly={!loginInfo.edit_mode}
          size="large"
          value={loginInfo.username}
        />
      </Field>
      <Show when={loginInfo.edit_mode}>
        <Field>
          <Field.Title>{t("settings.oldPassword")}</Field.Title>
          <PasswordInput
            onChange={(v) => setLoginInfo("old_password", v)}
            placeholder="********"
            size="large"
            value={loginInfo.old_password}
          />
        </Field>
        <Field>
          <Field.Title>{t("settings.newPassword")}</Field.Title>
          <PasswordInput
            onChange={(v) => setLoginInfo("new_password", v)}
            placeholder="********"
            size="large"
            value={loginInfo.new_password}
          />
        </Field>
        <Field>
          <Field.Title>{t("settings.confirmPassword")}</Field.Title>
          <PasswordInput
            onChange={(v) => setLoginInfo("confirm_password", v)}
            placeholder="********"
            size="large"
            value={loginInfo.confirm_password}
          />
        </Field>
      </Show>
      <div class="flex gap-md">
        <Show
          fallback={
            <Button
              onClick={() => {
                setLoginInfo("edit_mode", true);
              }}
            >
              {t("settings.editLogin")}
            </Button>
          }
          when={loginInfo.edit_mode}
        >
          <Button onClick={handleSave}>{t("settings.saveLogin")}</Button>

          <Button
            onClick={() => {
              setLoginInfo("edit_mode", false);
            }}
          >
            {t("global.cancel")}
          </Button>
        </Show>
      </div>
    </div>
  );
}
