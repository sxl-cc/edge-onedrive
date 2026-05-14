import { describe, expect, it } from "vitest";
import { normalizeUrlPath } from "../src/utils/path";

describe("Utils Test", () => {
  it("normalizeUrlPath", () => {
    expect(normalizeUrlPath("/", "\\a", "b", "/")).toBe("/a/b");
    expect(normalizeUrlPath("", "", "///a/b", "c")).toBe("/a/b/c");
  });
});
