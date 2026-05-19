export type BooleanEnvValue = boolean | string | undefined;

export function isEnabled(value: BooleanEnvValue) {
  return value === true || value === "true";
}
