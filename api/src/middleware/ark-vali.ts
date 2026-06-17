import type { Type } from "arktype";
import { type } from "arktype";
import type { Env, MiddlewareHandler, ValidationTargets } from "hono";
import { validator } from "hono/validator";
import { ApiError, type JsonValue } from "../utils/error";

type HasUndefined<T> = undefined extends T ? true : false;

interface ValidationIssue extends Record<string, JsonValue> {
  field: string;
  reason: string;
}

const RESTRICTED_DATA_FIELDS = {
  header: ["cookie"],
};

function readStringProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) {
    return;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}

function formatPath(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.map((part) => `${part}`).join(".");
}

function toValidationIssue(error: unknown): ValidationIssue {
  return {
    field: formatPath(
      error && typeof error === "object"
        ? (error as Record<string, unknown>).path
        : undefined
    ),
    reason: readStringProperty(error, "code") || "invalid",
  };
}

function createValidationDetails(
  target: keyof ValidationTargets,
  errors: type.errors
) {
  const restrictedFields =
    target in RESTRICTED_DATA_FIELDS
      ? RESTRICTED_DATA_FIELDS[target as keyof typeof RESTRICTED_DATA_FIELDS]
      : [];
  const issues = Array.from(errors)
    .map(toValidationIssue)
    .map((issue) =>
      restrictedFields.includes(issue.field) ? { ...issue, field: "" } : issue
    );
  const firstIssue = issues[0];

  return {
    target,
    field: firstIssue?.field ?? "",
    reason: firstIssue?.reason ?? "invalid",
    issues,
  };
}

export function arkVali<
  T extends Type,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  I = T["inferIn"],
  O = T["infer"],
  V extends {
    in: HasUndefined<I> extends true
      ? { [K in Target]?: I }
      : { [K in Target]: I };
    out: { [K in Target]: O };
  } = {
    in: HasUndefined<I> extends true
      ? { [K in Target]?: I }
      : { [K in Target]: I };
    out: { [K in Target]: O };
  },
>(target: Target, schema: T): MiddlewareHandler<E, P, V> {
  // @ts-expect-error not typed well
  return validator(target, (value) => {
    const out = schema(value);

    if (out instanceof type.errors) {
      throw new ApiError("Invalid request payload", {
        status: 400,
        details: createValidationDetails(target, out),
        code: "INVALID_REQUEST_PAYLOAD",
      });
    }

    return out;
  });
}
