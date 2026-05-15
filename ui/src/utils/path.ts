/**
 * Normalize and join paths
 *
 * @example
 *
 * ```ts
 * normalizeUrlPath("/", "\\a", "b", "/"); // "/a/b"
 * normalizeUrlPath("", "", "///a", "b"); // "/a/b"
 * ```
 */
export function normalizeUrlPath(...paths: string[]): string {
  const normalized = paths
    .join("/")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("/");

  return `/${normalized}`;
}
