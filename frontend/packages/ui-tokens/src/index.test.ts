import { describe, expect, it } from "vitest";

import { prototypeTokens } from "./index";

describe("prototypeTokens", () => {
  it("exposes initial token placeholders", () => {
    expect(prototypeTokens.color.text).toBe("#1b1b1b");
  });
});
