import { A } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import {
  Button,
  Field,
  PasswordInput,
  Textarea,
  TextField,
  useToaster,
} from "solid-tiny-ui";
import {
  createAuthorizationRequest,
  createDefaultPkceForm,
  type OAuthDebugForm,
  PKCE_FORM_STORAGE_KEY,
  PKCE_SESSION_STORAGE_KEY,
} from "../../../lib/pkce";

function readSavedForm() {
  try {
    const raw = localStorage.getItem(PKCE_FORM_STORAGE_KEY);

    if (!raw) {
      return createDefaultPkceForm();
    }

    return {
      ...createDefaultPkceForm(),
      ...(JSON.parse(raw) as Partial<OAuthDebugForm>),
    };
  } catch {
    return createDefaultPkceForm();
  }
}

export default function PkceDebugPage() {
  const toaster = useToaster();
  const [submitting, setSubmitting] = createSignal(false);
  const [form, setForm] = createSignal<OAuthDebugForm>(createDefaultPkceForm());

  createEffect(() => {
    setForm(readSavedForm());
  });

  createEffect(() => {
    localStorage.setItem(PKCE_FORM_STORAGE_KEY, JSON.stringify(form()));
  });

  const updateField = (key: keyof OAuthDebugForm) => (value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const beginAuthorization = async () => {
    const current = form();

    if (!current.clientId.trim()) {
      toaster.error("client_id is required");
      return;
    }

    if (!current.clientSecret.trim()) {
      toaster.error("client_secret is required");
      return;
    }

    if (!current.redirectUri.trim()) {
      toaster.error("redirect_uri is required");
      return;
    }

    if (!current.scopes.trim()) {
      toaster.error("At least one scope is required");
      return;
    }

    setSubmitting(true);

    try {
      const { authorizationUrl, sessionState } =
        await createAuthorizationRequest(current);

      sessionStorage.setItem(
        PKCE_SESSION_STORAGE_KEY,
        JSON.stringify(sessionState)
      );
      window.location.href = authorizationUrl;
    } catch (error) {
      toaster.error(error instanceof Error ? error.message : String(error));
      setSubmitting(false);
    }
  };

  return (
    <section class="grid gap-xl lg:grid-cols-[minmax(0,1.2fr)_360px]">
      <article class="rounded-6 bg-white p-xl shadow-sm ring-1 ring-black/5">
        <div class="mb-xl flex flex-col gap-sm">
          <p class="m-0 text-12px text-neutral-6 uppercase tracking-[0.18em]">
            OAuth Debug
          </p>
          <h2 class="m-0 font-700 text-3xl text-neutral-12">
            Get a refresh token with authorization code and client secret.
          </h2>
          <p class="m-0 max-w-3xl text-base text-neutral-7 leading-7">
            This page starts a traditional Microsoft authorization code flow,
            then lets the local API redeem the returned code with your{" "}
            <code>client_secret</code>. It is meant for local debugging only.
          </p>
        </div>

        <div class="grid gap-lg">
          <Field>
            <Field.Title>Authority host</Field.Title>
            <Field.Description>
              Usually <code>login.microsoftonline.com</code>
            </Field.Description>
            <TextField
              onChange={updateField("authorityHost")}
              size="large"
              value={form().authorityHost}
            />
          </Field>

          <Field>
            <Field.Title>Tenant</Field.Title>
            <Field.Description>
              Use <code>common</code>, <code>organizations</code>, or a tenant
              ID.
            </Field.Description>
            <TextField
              onChange={updateField("tenant")}
              size="large"
              value={form().tenant}
            />
          </Field>

          <Field>
            <Field.Title>Client ID</Field.Title>
            <Field.RequiredIndicator />
            <TextField
              onChange={updateField("clientId")}
              placeholder="Application (client) ID"
              size="large"
              value={form().clientId}
            />
          </Field>

          <Field>
            <Field.Title>Client Secret</Field.Title>
            <Field.RequiredIndicator />
            <Field.Description>
              This flow assumes a confidential client registration.
            </Field.Description>
            <PasswordInput
              onChange={updateField("clientSecret")}
              placeholder="Client secret"
              size="large"
              value={form().clientSecret}
            />
          </Field>

          <Field>
            <Field.Title>Redirect URI</Field.Title>
            <Field.RequiredIndicator />
            <Field.Description>
              Register this exact URI in the app registration.
            </Field.Description>
            <TextField
              onChange={updateField("redirectUri")}
              placeholder="http://localhost:5122/debug/pkce/callback"
              size="large"
              value={form().redirectUri}
            />
          </Field>

          <Field>
            <Field.Title>Scopes</Field.Title>
            <Field.RequiredIndicator />
            <Field.Description>
              Include <code>offline_access</code> if you want a refresh token.
            </Field.Description>
            <Textarea
              autosize
              onChange={updateField("scopes")}
              rows={3}
              value={form().scopes}
            />
          </Field>

          <div class="flex flex-wrap items-center gap-md">
            <Button loading={submitting()} onClick={beginAuthorization}>
              Start OAuth Sign-in
            </Button>
            <Button
              onClick={() => {
                setForm(createDefaultPkceForm());
              }}
            >
              Reset defaults
            </Button>
            <A class="text-sm text-teal-700 hover:text-teal-800" href="/">
              Back to overview
            </A>
          </div>
        </div>
      </article>

      <aside class="grid gap-lg">
        <section class="rounded-6 bg-[#102b2e] p-xl text-white shadow-sm">
          <p class="m-0 text-12px text-white/60 uppercase tracking-[0.18em]">
            Requested scopes
          </p>
        </section>

        <section class="rounded-6 bg-white p-xl shadow-sm ring-1 ring-black/5">
          <p class="m-0 text-12px text-neutral-6 uppercase tracking-[0.18em]">
            Notes
          </p>
          <ul class="m-0 mt-md grid list-disc gap-sm pl-lg text-neutral-7 text-sm leading-6">
            <li>
              Graph scopes are requested at runtime, not only in app
              registration.
            </li>
            <li>
              For refresh tokens, <code>offline_access</code> should be present
              in the request.
            </li>
            <li>
              This flow assumes a confidential client that redeems the
              authorization code with a secret.
            </li>
            <li>
              The browser never calls the Microsoft token endpoint directly. The
              local API performs the code exchange.
            </li>
          </ul>
        </section>
      </aside>
    </section>
  );
}
