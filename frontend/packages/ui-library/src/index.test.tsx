import { describe, expect, it } from "vitest";

import { PrototypePageShell } from "./index";

describe("PrototypePageShell", () => {
  it("exports the shell component", () => {
    expect(PrototypePageShell).toBeTypeOf("function");
  });
});
